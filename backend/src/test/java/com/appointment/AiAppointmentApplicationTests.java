package com.appointment;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.ai.chat.model.ChatModel;

@SpringBootTest
@ActiveProfiles("test")
@EnableAutoConfiguration(exclude = {
    org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration.class
})
class AiAppointmentApplicationTests {

    @MockBean
    private ChatModel chatModel;

    @Test
    void contextLoads() {
        // Verifies the Spring application context loads successfully
    }
}
