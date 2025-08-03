"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  Languages,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Zap,
  Globe,
  Shield,
  Clock,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

interface LanguageDetection {
  code: string
  name: string
  confidence: number
  flag: string
}

interface ProcessingLog {
  id: string
  type: "info" | "success" | "error"
  message: string
  timestamp: string
}

interface ProcessingStatus {
  jobId: string
  status: "processing" | "completed" | "failed"
  progress: number
  logs: ProcessingLog[]
}

export default function Home() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State management
  const [file, setFile] = useState<File | null>(null)
  const [documentId, setDocumentId] = useState<string>("")
  const [languages, setLanguages] = useState<LanguageDetection[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [extractText, setExtractText] = useState(true)
  const [extractTables, setExtractTables] = useState(false)
  const [extractImages, setExtractImages] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [jobId, setJobId] = useState<string>("")
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [extractedContent, setExtractedContent] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle")

  // Test backend connection
  const testConnection = async () => {
    setConnectionStatus("testing")
    try {
      const response = await fetch(`${API_BASE_URL}/hello`)
      if (response.ok) {
        const message = await response.text()
        setConnectionStatus("connected")
        toast({
          title: "Connection Successful",
          description: message,
        })
      } else {
        throw new Error("Connection failed")
      }
    } catch (error) {
      setConnectionStatus("failed")
      toast({
        title: "Connection Failed",
        description: "Unable to connect to backend server",
        variant: "destructive",
      })
    }
  }

  // File upload handler
  const handleFileUpload = async (selectedFile: File) => {
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setDocumentId(result.documentId)
        setFile(selectedFile)

        toast({
          title: "File Uploaded Successfully",
          description: `${selectedFile.name} has been uploaded`,
        })

        // Automatically detect languages
        await detectLanguages(result.documentId)
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file",
        variant: "destructive",
      })
    }
  }

  // Language detection
  const detectLanguages = async (docId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/languages/${docId}`)
      if (response.ok) {
        const detectedLanguages = await response.json()
        setLanguages(detectedLanguages)
        if (detectedLanguages.length > 0) {
          setSelectedLanguage(detectedLanguages[0].code)
        }
      }
    } catch (error) {
      console.error("Language detection failed:", error)
    }
  }

  // Start processing
  const startProcessing = async () => {
    if (!documentId || !selectedLanguage) {
      toast({
        title: "Missing Information",
        description: "Please upload a file and select a language",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      const response = await fetch(`${API_BASE_URL}/documents/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          language: selectedLanguage,
          extractText,
          extractTables,
          extractImages,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setJobId(result.jobId)

        toast({
          title: "Processing Started",
          description: "Document processing has begun",
        })

        // Start polling for status
        pollProcessingStatus(result.jobId)
      } else {
        throw new Error("Processing failed to start")
      }
    } catch (error) {
      setProcessing(false)
      toast({
        title: "Processing Failed",
        description: "Failed to start document processing",
        variant: "destructive",
      })
    }
  }

  // Poll processing status
  const pollProcessingStatus = async (currentJobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/documents/status/${currentJobId}`)
        if (response.ok) {
          const status = await response.json()
          setProcessingStatus(status)

          if (status.status === "completed") {
            setProcessing(false)
            toast({
              title: "Processing Complete",
              description: "Document has been processed successfully",
            })
            // Fetch extracted content
            await fetchExtractedContent(currentJobId)
          } else if (status.status === "failed") {
            setProcessing(false)
            toast({
              title: "Processing Failed",
              description: "Document processing failed",
              variant: "destructive",
            })
          } else {
            // Continue polling
            setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        console.error("Status polling failed:", error)
        setTimeout(poll, 2000)
      }
    }

    poll()
  }

  // Fetch extracted content
  const fetchExtractedContent = async (currentJobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/extract/${currentJobId}`)
      if (response.ok) {
        const content = await response.json()
        setExtractedContent(content)
      }
    } catch (error) {
      console.error("Failed to fetch extracted content:", error)
    }
  }

  // File input change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      handleFileUpload(selectedFile)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">DocuExtract AI</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Advanced Document Processing & Digitization Platform
          </p>
        </div>

        {/* Features Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Process documents in seconds</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold">Multi-Language</h3>
              <p className="text-sm text-muted-foreground">Support for 100+ languages</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold">Secure</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Real-time</h3>
              <p className="text-sm text-muted-foreground">Live processing updates</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload and Settings */}
          <div className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {connectionStatus === "connected" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {connectionStatus === "failed" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm">
                      {connectionStatus === "idle" && "Not tested"}
                      {connectionStatus === "testing" && "Testing..."}
                      {connectionStatus === "connected" && "Connected"}
                      {connectionStatus === "failed" && "Failed"}
                    </span>
                  </div>
                  <Button size="sm" onClick={testConnection} disabled={connectionStatus === "testing"}>
                    Test Backend Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>Upload your document for processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                    <div className="space-y-2">
                      <Button onClick={() => fileInputRef.current?.click()} disabled={processing}>
                        Choose File
                      </Button>
                      <p className="text-sm text-slate-500">Supports PDF, DOC, DOCX, TXT, and image files</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                    />
                  </div>

                  {file && (
                    <Alert>
                      <FileText className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Language Detection */}
            {languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Detected Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {languages.map((lang) => (
                        <div key={lang.code} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                          </div>
                          <Badge variant="secondary">{lang.confidence.toFixed(1)}%</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language-select">Select Processing Language</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.flag} {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Processing Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extract-text"
                      checked={extractText}
                      onCheckedChange={(checked) => setExtractText(checked as boolean)}
                    />
                    <Label htmlFor="extract-text">Extract Text Content</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extract-tables"
                      checked={extractTables}
                      onCheckedChange={(checked) => setExtractTables(checked as boolean)}
                    />
                    <Label htmlFor="extract-tables">Extract Tables</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="extract-images"
                      checked={extractImages}
                      onCheckedChange={(checked) => setExtractImages(checked as boolean)}
                    />
                    <Label htmlFor="extract-images">Extract Images</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start Processing */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={startProcessing}
                  disabled={!file || !selectedLanguage || processing}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {processing ? "Processing..." : "Start Processing"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Processing Status */}
          <div className="space-y-6">
            {processingStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Processing Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{processingStatus.progress}%</span>
                    </div>
                    <Progress value={processingStatus.progress} className="w-full" />

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          processingStatus.status === "completed"
                            ? "default"
                            : processingStatus.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {processingStatus.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Job ID: {processingStatus.jobId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Logs */}
            {processingStatus?.logs && processingStatus.logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {processingStatus.logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground min-w-[60px]">{log.timestamp}</span>
                          <Badge
                            variant={
                              log.type === "success" ? "default" : log.type === "error" ? "destructive" : "secondary"
                            }
                            className="min-w-[60px] justify-center"
                          >
                            {log.type}
                          </Badge>
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {extractedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Extracted Content
                  </CardTitle>
                  <CardDescription>View and download processed results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="markdown">Markdown</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <h4 className="font-semibold mb-2">Document Summary</h4>
                        <p className="text-sm text-muted-foreground">{extractedContent.summary}</p>
                      </div>

                      {extractedContent.document && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {extractedContent.document.pages}
                            </div>
                            <div className="text-sm text-muted-foreground">Pages</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {extractedContent.document.wordCount}
                            </div>
                            <div className="text-sm text-muted-foreground">Words</div>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4">
                      <ScrollArea className="h-64">
                        {extractedContent.document?.sections?.map((section: any, index: number) => (
                          <div key={index} className="mb-4">
                            {section.type === "heading" && (
                              <h3 className="text-lg font-semibold mb-2">{section.content}</h3>
                            )}
                            {section.type === "paragraph" && (
                              <p className="text-sm text-muted-foreground mb-2">{section.content}</p>
                            )}
                            {section.type === "table" && (
                              <div className="border rounded-lg p-2 mb-2">
                                <div className="text-sm font-medium mb-1">
                                  Table ({section.rows} rows × {section.columns} columns)
                                </div>
                                {section.data && (
                                  <div className="text-xs">
                                    {section.data.slice(0, 2).map((row: string[], rowIndex: number) => (
                                      <div key={rowIndex} className="flex gap-2 mb-1">
                                        {row.map((cell: string, cellIndex: number) => (
                                          <span
                                            key={cellIndex}
                                            className="flex-1 p-1 bg-slate-100 dark:bg-slate-700 rounded"
                                          >
                                            {cell}
                                          </span>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="markdown" className="space-y-4">
                      <ScrollArea className="h-64">
                        <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto">
                          {extractedContent.markdown}
                        </pre>
                      </ScrollArea>
                      <Button className="w-full bg-transparent" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Markdown
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
