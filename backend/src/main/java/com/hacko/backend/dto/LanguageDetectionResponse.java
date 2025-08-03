package com.hacko.backend.dto;

public class LanguageDetectionResponse {
    private String code;
    private String name;
    private Double confidence;
    private String flag;

    // Default constructor
    public LanguageDetectionResponse() {}

    // Constructor with all fields
    public LanguageDetectionResponse(String code, String name, Double confidence, String flag) {
        this.code = code;
        this.name = name;
        this.confidence = confidence;
        this.flag = flag;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getFlag() {
        return flag;
    }

    public void setFlag(String flag) {
        this.flag = flag;
    }

    @Override
    public String toString() {
        return "LanguageDetectionResponse{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", confidence=" + confidence +
                ", flag='" + flag + '\'' +
                '}';
    }
}
