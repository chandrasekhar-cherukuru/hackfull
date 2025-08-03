package com.hacko.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DocumentProcessingRequest {
    
    @NotBlank(message = "Document ID is required")
    private String documentId;
    
    @NotBlank(message = "Language is required")
    private String language;
    
    @NotNull(message = "Extract text flag is required")
    private Boolean extractText;
    
    @NotNull(message = "Extract tables flag is required")
    private Boolean extractTables;
    
    @NotNull(message = "Extract images flag is required")
    private Boolean extractImages;

    // Default constructor
    public DocumentProcessingRequest() {
        this.extractText = true;
        this.extractTables = false;
        this.extractImages = false;
    }

    // Constructor with all fields
    public DocumentProcessingRequest(String documentId, String language, Boolean extractText, Boolean extractTables, Boolean extractImages) {
        this.documentId = documentId;
        this.language = language;
        this.extractText = extractText;
        this.extractTables = extractTables;
        this.extractImages = extractImages;
    }

    // Getters and Setters
    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Boolean getExtractText() {
        return extractText;
    }

    public void setExtractText(Boolean extractText) {
        this.extractText = extractText;
    }

    public Boolean getExtractTables() {
        return extractTables;
    }

    public void setExtractTables(Boolean extractTables) {
        this.extractTables = extractTables;
    }

    public Boolean getExtractImages() {
        return extractImages;
    }

    public void setExtractImages(Boolean extractImages) {
        this.extractImages = extractImages;
    }

    // Convenience methods for boolean checks
    public boolean isExtractText() {
        return extractText != null && extractText;
    }

    public boolean isExtractTables() {
        return extractTables != null && extractTables;
    }

    public boolean isExtractImages() {
        return extractImages != null && extractImages;
    }

    @Override
    public String toString() {
        return "DocumentProcessingRequest{" +
                "documentId='" + documentId + '\'' +
                ", language='" + language + '\'' +
                ", extractText=" + extractText +
                ", extractTables=" + extractTables +
                ", extractImages=" + extractImages +
                '}';
    }
}
