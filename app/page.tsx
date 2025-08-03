"use client"

import type React from "react"

import { useState, useCallback } from "react"
import {
  Upload,
  FileText,
  ImageIcon,
  Download,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

// ⚠️ UPDATED TO MATCH YOUR BACKEND PORT (8080)
const API_BASE_URL = "http://localhost:8080/api"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  thumbnail: string
  documentId?: string
}

interface DetectedLanguage {
  code: string
  name: string
  confidence: number
  flag: string
}

interface ProcessingLog {
  id: string
  message: string
  timestamp: string
  type: "info" | "success" | "warning" | "error"
}

interface ProcessingStatus {
  jobId: string
  status: string
  progress: number
  logs: ProcessingLog[]
}

interface ExtractedContent {
  document?: any
  markdown?: string
  summary?: string
}

export default function DocumentDigitizationTool() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [detectedLanguages, setDetectedLanguages] = useState<DetectedLanguage[]>([])
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [extractedContent, setExtractedContent] = useState<ExtractedContent>({})
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [layerVisibility, setLayerVisibility] = useState({
    text: true,
    tables: true,
    images: true,
    headings: true,
  })

  const { toast } = useToast()

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files) return

      for (const file of Array.from(files)) {
        console.log("Uploading file:", file.name, "to:", `${API_BASE_URL}/documents/upload`)

        const formData = new FormData()
        formData.append("file", file)

        try {
          const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: "POST",
            body: formData,
          })

          console.log("Upload response status:", response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Upload failed:", errorText)
            throw new Error(`Upload failed: ${response.status} ${errorText}`)
          }

          const result = await response.json()
          console.log("Upload success:", result)

          const newFile: UploadedFile = {
            id: result.documentId,
            name: result.fileName,
            type: result.contentType,
            size: result.fileSize,
            thumbnail: "/placeholder.svg?height=80&width=80",
            documentId: result.documentId,
          }

          setUploadedFiles((prev) => [...prev, newFile])

          // Fetch detected languages for this document
          const langResponse = await fetch(`${API_BASE_URL}/documents/languages/${result.documentId}`)
          if (langResponse.ok) {
            const languages = await langResponse.json()
            setDetectedLanguages(languages)
          }

          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been uploaded and is ready for processing.`,
          })
        } catch (error) {
          console.error("Upload error:", error)
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}. Error: ${error}`,
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  const startExtraction = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to process",
        description: "Please upload at least one document before starting extraction.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setProcessingLogs([])

    try {
      const request = {
        documentId: uploadedFiles[0].documentId,
        language: selectedLanguage || "auto",
        extractTables: layerVisibility.tables,
        extractImages: layerVisibility.images,
        extractText: layerVisibility.text,
        outputFormat: "json",
      }

      const response = await fetch(`${API_BASE_URL}/documents/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error("Processing failed to start")
      }

      const result = await response.json()
      setCurrentJobId(result.jobId)

      // Start polling for status updates
      pollProcessingStatus(result.jobId)

      toast({
        title: "Processing started",
        description: "Document processing has been initiated. Please wait for completion.",
      })
    } catch (error) {
      console.error("Processing error:", error)
      setIsProcessing(false)
      toast({
        title: "Processing failed",
        description: "Failed to start document processing. Please try again.",
        variant: "destructive",
      })
    }
  }, [uploadedFiles, selectedLanguage, layerVisibility, toast])

  const pollProcessingStatus = useCallback(
    async (jobId: string) => {
      const poll = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/documents/status/${jobId}`)
          if (!response.ok) return

          const status: ProcessingStatus = await response.json()

          setProcessingProgress(status.progress)
          setProcessingLogs(status.logs)

          if (status.status === "completed") {
            setIsProcessing(false)

            // Fetch extracted content
            const contentResponse = await fetch(`${API_BASE_URL}/documents/extract/${jobId}`)
            if (contentResponse.ok) {
              const content = await contentResponse.json()
              setExtractedContent(content)
            }

            toast({
              title: "Processing completed",
              description: "Document has been successfully processed and content extracted.",
            })

            return
          } else if (status.status === "failed") {
            setIsProcessing(false)
            toast({
              title: "Processing failed",
              description: "Document processing encountered an error.",
              variant: "destructive",
            })
            return
          }

          // Continue polling if still processing
          if (status.status === "processing") {
            setTimeout(poll, 1000)
          }
        } catch (error) {
          console.error("Status polling error:", error)
          setIsProcessing(false)
        }
      }

      poll()
    },
    [toast],
  )

  const clearAll = useCallback(() => {
    setUploadedFiles([])
    setDetectedLanguages([])
    setProcessingProgress(0)
    setIsProcessing(false)
    setProcessingLogs([])
    setCurrentJobId(null)
    setExtractedContent({})
    setSelectedLanguage("")
  }, [])

  const toggleLayer = useCallback((layer: keyof typeof layerVisibility) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }))
  }, [])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const downloadContent = useCallback(
    (format: string) => {
      let content = ""
      let filename = ""
      let mimeType = ""

      switch (format) {
        case "json":
          content = JSON.stringify(extractedContent.document || {}, null, 2)
          filename = "extracted-content.json"
          mimeType = "application/json"
          break
        case "markdown":
          content = extractedContent.markdown || ""
          filename = "extracted-content.md"
          mimeType = "text/markdown"
          break
        case "summary":
          content = extractedContent.summary || ""
          filename = "document-summary.txt"
          mimeType = "text/plain"
          break
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [extractedContent],
  )

  const testConnection = useCallback(async () => {
    try {
      console.log("Testing connection to:", API_BASE_URL)
      const response = await fetch(`${API_BASE_URL}/hello`)
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.text()
        console.log("Backend response:", data)
        toast({
          title: "Connection successful!",
          description: "Backend is connected and responding.",
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      toast({
        title: "Connection failed",
        description: `Cannot connect to backend: ${error}`,
        variant: "destructive",
      })
    }
  }, [toast])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">DocuExtract AI</h1>
            </div>
            <nav className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                History
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Backend API: {API_BASE_URL}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testConnection} className="w-full">
                  Test Backend Connection
                </Button>
              </CardContent>
            </Card>

            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <span>Upload Documents</span>
                </CardTitle>
                <CardDescription>Support for PDF, DOCX, PPT, and image formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-4">Drag & drop files here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Choose Files
                  </Button>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
                    <ScrollArea className="h-32">
                      {uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg mb-2">
                          <ImageIcon className="w-10 h-10 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Language Detection */}
            <Card>
              <CardHeader>
                <CardTitle>Language Detection</CardTitle>
                <CardDescription>Detected languages and scripts in your documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {detectedLanguages.map((lang) => (
                    <div key={lang.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lang.name}</p>
                          <p className="text-xs text-gray-500">{lang.confidence}% confidence</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{lang.code.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Override Language</label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span>Processing Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Processing Logs</h4>
                    <ScrollArea className="h-24 bg-gray-50 rounded-lg p-3">
                      {processingLogs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-2 mb-2 last:mb-0">
                          {log.type === "success" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                          {log.type === "info" && <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                          {log.type === "warning" && <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />}
                          {log.type === "error" && <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                          <div className="flex-1">
                            <p className="text-xs text-gray-700">{log.message}</p>
                            <p className="text-xs text-gray-500">{log.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={startExtraction}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Extraction
              </Button>
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Right Column - Document Viewer and Output */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Viewer */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Document Viewer</CardTitle>
                    <CardDescription>Preview with layout highlighting and layer controls</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {Object.entries(layerVisibility).map(([layer, visible]) => (
                      <Button
                        key={layer}
                        variant={visible ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleLayer(layer as keyof typeof layerVisibility)}
                        className="capitalize"
                      >
                        {visible ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                        {layer}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
                  <img
                    src="/placeholder.svg?height=400&width=600"
                    alt="Document preview"
                    className="w-full h-full object-contain"
                  />
                  {/* Overlay bounding boxes */}
                  {layerVisibility.text && (
                    <div className="absolute inset-0">
                      <div className="absolute top-12 left-8 w-32 h-4 border-2 border-blue-400 bg-blue-100 bg-opacity-30 rounded"></div>
                      <div className="absolute top-20 left-8 w-48 h-6 border-2 border-blue-400 bg-blue-100 bg-opacity-30 rounded"></div>
                    </div>
                  )}
                  {layerVisibility.tables && (
                    <div className="absolute top-32 left-8 w-64 h-24 border-2 border-green-400 bg-green-100 bg-opacity-30 rounded"></div>
                  )}
                  {layerVisibility.images && (
                    <div className="absolute top-32 right-8 w-32 h-32 border-2 border-purple-400 bg-purple-100 bg-opacity-30 rounded"></div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Structured Output Panel */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Extracted Content</CardTitle>
                    <CardDescription>View and download extracted content in multiple formats</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => downloadContent("json")}>
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadContent("markdown")}>
                      <Download className="w-4 h-4 mr-2" />
                      Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadContent("summary")}>
                      <Download className="w-4 h-4 mr-2" />
                      Summary
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="json" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="json">JSON View</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown View</TabsTrigger>
                    <TabsTrigger value="natural">Natural Language</TabsTrigger>
                  </TabsList>

                  <TabsContent value="json" className="mt-4">
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-auto">
                      <pre>{JSON.stringify(extractedContent.document || {}, null, 2)}</pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="markdown" className="mt-4">
                    <div className="bg-white border rounded-lg p-4 h-64 overflow-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap">
                          {extractedContent.markdown || "No content extracted yet."}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="natural" className="mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-64 overflow-auto">
                      <p className="text-gray-800 leading-relaxed">
                        {extractedContent.summary || "No summary available yet. Please process a document first."}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
