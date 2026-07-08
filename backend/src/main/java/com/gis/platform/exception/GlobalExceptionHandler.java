package com.gis.platform.exception;

import com.gis.platform.dto.response.ApiResult;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .orElse("参数校验失败");
        return ApiResult.fail(1000, message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ApiResult<?> handleUnreadableBody(HttpMessageNotReadableException e) {
        return ApiResult.fail(1000, "请求体格式错误");
    }

    @ExceptionHandler(Exception.class)
    public ApiResult<?> handleException(Exception e) {
        return ApiResult.fail(9999, "系统异常: " + e.getMessage());
    }
}

