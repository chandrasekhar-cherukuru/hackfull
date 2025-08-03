package com.hacko.backend.dto;

public class DocumentProcessingResponse {
    private String documentId;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private String status;
    private String message;

    // Default constructor
    public DocumentProcessingResponse() {}

    // Constructor with basic fields
    public DocumentProcessingResponse(String documentId, String status) {
        this.documentId = documentId;
        this.status = status;
    }

    // Constructor with message
    public DocumentProcessingResponse(String documentId, String status, String message) {
        this.documentId = documentId;
        this.status = status;
        this.message = message;
    }

    // Getters and Setters
    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    @Override
    public String toString() {
        return "DocumentProcessingResponse{" +
                "documentId='" + documentId + '\'' +
                ", fileName='" + fileName + '\'' +
                ", contentType='" + contentType + '\'' +
                ", fileSize=" + fileSize +
                ", status='" + status + '\'' +
                ", message='" + message + '\'' +
                '}';
    }
}
