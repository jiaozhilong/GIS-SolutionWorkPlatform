package com.gis.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@MapperScan("com.gis.platform.mapper")
@SpringBootApplication
public class GisPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(GisPlatformApplication.class, args);
    }
}
