package com.hacko.backend.dto;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

public class ProcessingStatusResponse {
    private String jobId;
    private String status;
    private int progress;
    private List<Map<String, Object>> logs;

    // Default constructor
    public ProcessingStatusResponse() {
        this.logs = new ArrayList<>();
    }

    // Constructor with basic fields
    public ProcessingStatusResponse(String jobId, String status, int progress, List<Map<String, Object>> logs) {
        this.jobId = jobId;
        this.status = status;
        this.progress = progress;
        this.logs = logs != null ? logs : new ArrayList<>();
    }

    // Getters and Setters
    public String getJobId() { 
        return jobId; 
    }
    
    public void setJobId(String jobId) { 
        this.jobId = jobId; 
    }

    public String getStatus() { 
        return status; 
    }
    
    public void setStatus(String status) { 
        this.status = status; 
    }

    public int getProgress() { 
        return progress; 
    }
    
    public void setProgress(int progress) { 
        this.progress = progress; 
    }

    public List<Map<String, Object>> getLogs() { 
        return logs; 
    }
    
    public void setLogs(List<Map<String, Object>> logs) { 
        this.logs = logs; 
    }

    @Override
    public String toString() {
        return "ProcessingStatusResponse{" +
                "jobId='" + jobId + '\'' +
                ", status='" + status + '\'' +
                ", progress=" + progress +
                ", logs=" + logs +
                '}';
    }
}
