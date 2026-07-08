package com.gis.platform.controller;

import com.gis.platform.dto.response.ApiResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public ApiResult<String> hello() {
        return ApiResult.ok("Hello GIS Platform");
    }
}

