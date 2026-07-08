package com.gis.platform.dto.response;

import java.util.UUID;

public class ApiResult<T> {

    private int code;
    private String message;
    private T data;
    private String requestId;

    public static <T> ApiResult<T> ok(T data) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(0);
        result.setMessage("success");
        result.setData(data);
        result.setRequestId(UUID.randomUUID().toString());
        return result;
    }

    public static <T> ApiResult<T> fail(int code, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.setCode(code);
        result.setMessage(message);
        result.setRequestId(UUID.randomUUID().toString());
        return result;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }
}

