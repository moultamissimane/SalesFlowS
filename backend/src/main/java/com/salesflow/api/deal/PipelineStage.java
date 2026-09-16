package com.salesflow.api.deal;

public enum PipelineStage {
    NEW_LEAD(10),
    CONTACTED(25),
    QUALIFIED(50),
    PROPOSAL(70),
    NEGOTIATION(85),
    WON(100),
    LOST(0);

    private final int defaultProbability;

    PipelineStage(int defaultProbability) {
        this.defaultProbability = defaultProbability;
    }

    public int defaultProbability() {
        return defaultProbability;
    }
}
