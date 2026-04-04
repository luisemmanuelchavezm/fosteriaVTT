package com.fosteriaVTT.fosteriaVTT_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.fosteriaVTT.fosteriaVTT_backend")
@EnableJpaRepositories(basePackages = "com.fosteriaVTT.fosteriaVTT_backend")
public class FosteriaVttBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FosteriaVttBackendApplication.class, args);
	}

}
