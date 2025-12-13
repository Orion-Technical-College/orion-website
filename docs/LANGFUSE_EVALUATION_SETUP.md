# Langfuse Evaluation Module Setup Guide

This guide explains how to configure LLM-as-judge evaluators in Langfuse to automatically evaluate AI responses.

## Overview

Langfuse's Evaluation module allows you to:
- **LLM-as-Judge**: Automatically evaluate traces using another LLM
- **Human Annotation**: Manual review queues for quality assurance
- **Scores**: Track user feedback and custom metrics
- **Datasets**: Test prompts on datasets before production

## Setting Up LLM-as-Judge Evaluators

### Step 1: Navigate to Evaluation Section

1. Go to your Langfuse dashboard: https://us.cloud.langfuse.com
2. In the left sidebar, click **"Evaluation"** → **"LLM-as-a-Judge"**

### Step 2: Create an Evaluator

1. Click **"+ Create Evaluator"** or **"New Evaluator"**
2. Fill in the evaluator configuration:

#### Basic Configuration

- **Name**: `correctness-evaluator` (or any descriptive name)
- **Description**: "Evaluates if AI responses are accurate and helpful"
- **Model**: Select your evaluation model (e.g., `gpt-4o`, `gpt-4o-mini`)
- **Temperature**: `0` (for consistent evaluation)

#### Evaluation Criteria

**Option 1: Full Trace Evaluation**
- **Scope**: "Whole Trace"
- Evaluates the entire conversation (input + output)

**Option 2: Specific Section Evaluation**
- **Scope**: "Specific Observation"
- **Observation Name**: `azure-openai-chat` (the generation name)
- Evaluates only the LLM generation output

#### Prompt Template

Create a prompt that instructs the judge model to evaluate the response:

```
You are an expert evaluator assessing AI assistant responses.

Evaluate the following AI response for correctness and helpfulness.

User Query: {{input}}
AI Response: {{output}}

Rate the response on a scale of 0-1:
- 1: Response is accurate, helpful, and addresses the user's query
- 0: Response is incorrect, unhelpful, or doesn't address the query

Provide your score and a brief reasoning.
```

#### Output Format

Configure the output format:
- **Type**: "Score" (returns 0-1)
- **Schema**: JSON with `score` (number) and `reasoning` (string)

### Step 3: Configure Auto-Run

1. Enable **"Run on new traces"**
2. Set **Filter Conditions** (optional):
   - Trace name: `ai-chat-candidate-query`
   - Or leave empty to evaluate all traces

### Step 4: Create Additional Evaluators (Optional)

#### Filter Accuracy Evaluator

For evaluating if suggested filters are correct:

- **Name**: `filter-accuracy-evaluator`
- **Scope**: "Whole Trace"
- **Prompt**: 
```
Evaluate if the AI correctly suggested filters based on the user query.

User Query: {{input}}
AI Response: {{output}}
Metadata: {{metadata}}

Check if:
1. Filters match the user's intent
2. Filter values are valid
3. Response provides helpful context

Score: 1 if filters are accurate, 0 if incorrect or missing.
```

#### Response Relevance Evaluator

- **Name**: `relevance-evaluator`
- **Scope**: "Specific Observation" → `azure-openai-chat`
- **Prompt**:
```
Does the AI response directly address the user's query?

User Query: {{input}}
AI Response: {{output}}

Score: 1 if relevant, 0 if off-topic.
```

## Viewing Evaluation Results

### In Langfuse Dashboard

1. Go to **"Evaluation"** → **"Scores"**
2. View all scores across traces
3. Filter by evaluator name, score value, date range

### In Trace Details

1. Open any trace in **"Observability"** → **"Tracing"**
2. Scroll to the **"Scores"** section
3. See all evaluator scores for that trace

### Evaluation Dashboard

1. Go to **"Evaluation"** → **"Scores"**
2. Use the dashboard to:
   - Plot score distributions over time
   - Compare different prompt versions
   - Filter by conditions (e.g., low scores, specific dates)

## Manual Annotation Queues

For human review of problematic traces:

### Step 1: Create Annotation Queue

1. Go to **"Evaluation"** → **"Human Annotation"**
2. Click **"+ Create Queue"**
3. Name it: `review-negative-feedback`

### Step 2: Configure Queue Filters

Set up filters to automatically add traces:
- **Score**: `user-feedback` < 0.5 (negative feedback)
- **Time Range**: Last 7 days
- **Trace Name**: `ai-chat-candidate-query`

### Step 3: Review Interface

1. Open the queue
2. Review traces one by one
3. Add scores and comments
4. Mark as complete to move to next

## Testing Evaluators

### Test on Existing Traces

1. Go to **"Evaluation"** → **"LLM-as-a-Judge"**
2. Select your evaluator
3. Click **"Run on existing traces"**
4. Select date range or specific traces
5. Click **"Run Evaluation"**

### Monitor Evaluator Performance

- Check evaluator logs for errors
- Review score distributions
- Adjust prompts if scores seem biased

## Best Practices

1. **Start Simple**: Create one evaluator for overall correctness first
2. **Use Specific Prompts**: Clear evaluation criteria yield better results
3. **Monitor Costs**: LLM-as-judge uses additional API calls
4. **Combine with User Feedback**: Use both automated and human evaluation
5. **Iterate on Prompts**: Refine evaluator prompts based on results

## Troubleshooting

### Evaluators Not Running

- Check that "Run on new traces" is enabled
- Verify filter conditions match your trace names
- Check evaluator logs for errors

### Scores Seem Inaccurate

- Review evaluator prompt for clarity
- Check if model has enough context
- Consider using a more capable model for evaluation

### High Evaluation Costs

- Use smaller models for evaluation (e.g., `gpt-4o-mini`)
- Reduce evaluation frequency
- Use filters to evaluate only important traces

## Next Steps

After setting up evaluators:

1. **Monitor Scores**: Check evaluation dashboard regularly
2. **Review Low Scores**: Use annotation queues for manual review
3. **Improve Prompts**: Use evaluation results to refine your prompts
4. **A/B Test**: Compare different prompt versions using datasets
