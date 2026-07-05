package com.appointment.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Async configuration for non-blocking email dispatch.
 * Emails are sent on a dedicated thread pool so API responses are never delayed.
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-async-");
        executor.setRejectedExecutionHandler((r, exec) ->
                log.error("Email task rejected – queue is full. Consider increasing pool size."));
        executor.initialize();
        log.info("Email async executor initialized: core={}, max={}, queue={}",
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        return executor;
    }
}
