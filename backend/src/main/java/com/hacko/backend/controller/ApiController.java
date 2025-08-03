package com.hacko.backend.controller;

import com.hacko.backend.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3007",
        "http://127.0.0.1:3007"
})
public class ApiController {

    private final Map<String, Object> documentStorage = new ConcurrentHashMap<>();
    private final Map<String, ProcessingStatusResponse> jobStorage = new ConcurrentHashMap<>();
    private final Map<String, Object> extractedContentStorage = new ConcurrentHashMap<>();

    @GetMapping("/hello")
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Backend is connected and running! Time: " + LocalDateTime.now());
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<DocumentProcessingResponse> uploadDocument(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            String documentId = UUID.randomUUID().toString();
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("originalName", file.getOriginalFilename());
            fileInfo.put("contentType", file.getContentType());
            fileInfo.put("size", file.getSize());
            fileInfo.put("uploadTime", LocalDateTime.now());
            fileInfo.put("data", file.getBytes());

            documentStorage.put(documentId, fileInfo);

            DocumentProcessingResponse response = new DocumentProcessingResponse();
            response.setDocumentId(documentId);
            response.setFileName(file.getOriginalFilename());
            response.setContentType(file.getContentType());
            response.setFileSize(file.getSize());
            response.setStatus("uploaded");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/documents/languages/{documentId}")
    public ResponseEntity<List<LanguageDetectionResponse>> detectLanguages(@PathVariable String documentId) {
        if (!documentStorage.containsKey(documentId)) {
            return ResponseEntity.notFound().build();
        }

        List<LanguageDetectionResponse> languages = Arrays.asList(
                new LanguageDetectionResponse("en", "English", 95.5, "🇺🇸"),
                new LanguageDetectionResponse("es", "Spanish", 78.2, "🇪🇸"),
                new LanguageDetectionResponse("fr", "French", 45.1, "🇫🇷")
        );

        return ResponseEntity.ok(languages);
    }

    @PostMapping("/documents/process")
    public ResponseEntity<Map<String, String>> processDocument(@RequestBody DocumentProcessingRequest request) {
        if (!documentStorage.containsKey(request.getDocumentId())) {
            return ResponseEntity.badRequest().build();
        }

        String jobId = UUID.randomUUID().toString();

        ProcessingStatusResponse status = new ProcessingStatusResponse();
        status.setJobId(jobId);
        status.setStatus("processing");
        status.setProgress(0);
        status.setLogs(new ArrayList<>());
        jobStorage.put(jobId, status);

        simulateProcessing(jobId, request);

        Map<String, String> response = new HashMap<>();
        response.put("jobId", jobId);
        response.put("status", "started");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/documents/status/{jobId}")
    public ResponseEntity<ProcessingStatusResponse> getProcessingStatus(@PathVariable String jobId) {
        ProcessingStatusResponse status = jobStorage.get(jobId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }

    @GetMapping("/documents/extract/{jobId}")
    public ResponseEntity<Map<String, Object>> getExtractedContent(@PathVariable String jobId) {
        Object content = extractedContentStorage.get(jobId);
        if (content == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok((Map<String, Object>) content);
    }

    private void simulateProcessing(String jobId, DocumentProcessingRequest request) {
        new Thread(() -> {
            try {
                ProcessingStatusResponse status = jobStorage.get(jobId);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss");

                status.setProgress(10);
                status.getLogs().add(createLog("info", "Starting document processing...", formatter));
                Thread.sleep(1000);

                status.setProgress(30);
                status.getLogs().add(createLog("info", "Extracting text content...", formatter));
                Thread.sleep(1500);

                if (request.isExtractTables()) {
                    status.setProgress(50);
                    status.getLogs().add(createLog("info", "Detecting and extracting tables...", formatter));
                    Thread.sleep(1000);
                }

                if (request.isExtractImages()) {
                    status.setProgress(70);
                    status.getLogs().add(createLog("info", "Processing images...", formatter));
                    Thread.sleep(1000);
                }

                status.setProgress(85);
                status.getLogs().add(createLog("info", "Processing language: " + request.getLanguage(), formatter));
                Thread.sleep(800);

                status.setProgress(100);
                status.setStatus("completed");
                status.getLogs().add(createLog("success", "Document processing completed successfully!", formatter));

                Map<String, Object> extractedContent = new HashMap<>();
                Map<String, Object> document = new HashMap<>();
                document.put("title", "Sample Document Title");
                document.put("pages", 3);
                document.put("wordCount", 1250);
                document.put("language", request.getLanguage());

                List<Map<String, Object>> sections = new ArrayList<>();

                Map<String, Object> section1 = new HashMap<>();
                section1.put("type", "heading");
                section1.put("content", "Introduction");
                section1.put("level", 1);
                sections.add(section1);

                Map<String, Object> section2 = new HashMap<>();
                section2.put("type", "paragraph");
                section2.put("content", "This is a sample paragraph extracted from the document. It contains important information about the document processing capabilities.");
                sections.add(section2);

                if (request.isExtractTables()) {
                    Map<String, Object> table = new HashMap<>();
                    table.put("type", "table");
                    table.put("rows", 5);
                    table.put("columns", 3);
                    table.put("data", Arrays.asList(
                            Arrays.asList("Header 1", "Header 2", "Header 3"),
                            Arrays.asList("Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"),
                            Arrays.asList("Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3")
                    ));
                    sections.add(table);
                }

                document.put("sections", sections);
                extractedContent.put("document", document);

                StringBuilder markdown = new StringBuilder();
                markdown.append("# Sample Document Title\n\n");
                markdown.append("## Introduction\n\n");
                markdown.append("This is a sample paragraph extracted from the document. It contains important information about the document processing capabilities.\n\n");

                if (request.isExtractTables()) {
                    markdown.append("## Data Table\n\n");
                    markdown.append("| Header 1 | Header 2 | Header 3 |\n");
                    markdown.append("|----------|----------|----------|\n");
                    markdown.append("| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |\n");
                    markdown.append("| Row 2 Col 1 | Row 2 Col 2 | Row 2 Col 3 |\n\n");
                }

                extractedContent.put("markdown", markdown.toString());

                extractedContent.put("summary", "This document appears to be a sample document containing " +
                        document.get("wordCount") + " words across " + document.get("pages") +
                        " pages. The main content includes an introduction section" +
                        (request.isExtractTables() ? " and structured data tables" : "") +
                        ". The document is primarily in " + request.getLanguage() + " language.");

                extractedContentStorage.put(jobId, extractedContent);

            } catch (InterruptedException e) {
                ProcessingStatusResponse status = jobStorage.get(jobId);
                status.setStatus("failed");
                status.getLogs().add(createLog("error", "Processing was interrupted",
                        DateTimeFormatter.ofPattern("HH:mm:ss")));
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                ProcessingStatusResponse status = jobStorage.get(jobId);
                status.setStatus("failed");
                status.getLogs().add(createLog("error", "Processing failed: " + e.getMessage(),
                        DateTimeFormatter.ofPattern("HH:mm:ss")));
            }
        }).start();
    }

    private Map<String, Object> createLog(String type, String message, DateTimeFormatter formatter) {
        Map<String, Object> log = new HashMap<>();
        log.put("id", UUID.randomUUID().toString());
        log.put("type", type);
        log.put("message", message);
        log.put("timestamp", LocalDateTime.now().format(formatter));
        return log;
    }
}
