"use client";

/**
 * Quiz Player Component
 *
 * Displays quiz questions with support for multiple attempts and mastery tracking.
 * ELITE encourages retakes for deliberate practice.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// ============================================
// Types
// ============================================

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  type: "multiple_choice" | "true_false" | "multiple_select";
  options: QuizOption[];
  points?: number;
}

interface QuizContent {
  itemId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
  allowRetakes: boolean;
}

interface QuizResult {
  questionId: string;
  correct: boolean;
  selectedAnswers: string[];
  correctAnswers: string[];
  explanation?: string;
}

interface QuizSubmissionResult {
  score: number;
  passed: boolean;
  itemCompleted: boolean;
  results: QuizResult[];
}

interface AttemptHistory {
  id: string;
  score: number;
  attemptNumber: number;
  completedAt: string;
}

interface QuizPlayerProps {
  courseId: string;
  moduleId: string;
  itemId: string;
  enrollmentId: string;
  onComplete?: () => void;
  nextItemPath?: string;
}

// ============================================
// Question Components
// ============================================

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswers,
  onAnswerChange,
  result,
  showResults,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswers: string[];
  onAnswerChange: (answers: string[]) => void;
  result?: QuizResult;
  showResults: boolean;
}) {
  const isMultiSelect = question.type === "multiple_select";

  const handleSingleSelect = (value: string) => {
    onAnswerChange([value]);
  };

  const handleMultiSelect = (optionId: string, checked: boolean) => {
    if (checked) {
      onAnswerChange([...selectedAnswers, optionId]);
    } else {
      onAnswerChange(selectedAnswers.filter((id) => id !== optionId));
    }
  };

  const getOptionStyle = (optionId: string) => {
    if (!showResults || !result) return "";

    const isSelected = result.selectedAnswers.includes(optionId);
    const isCorrect = result.correctAnswers.includes(optionId);

    if (isCorrect) {
      return "border-green-500 bg-green-950/30";
    }
    if (isSelected && !isCorrect) {
      return "border-red-500 bg-red-950/30";
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        {showResults && result && (
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              result.correct ? "text-green-400" : "text-red-400"
            )}
          >
            {result.correct ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Correct
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Incorrect
              </>
            )}
          </span>
        )}
      </div>

      <h3 className="text-lg font-medium text-zinc-100">{question.text}</h3>

      {isMultiSelect && !showResults && (
        <p className="text-sm text-zinc-500">Select all that apply</p>
      )}

      <div className="space-y-2">
        {isMultiSelect ? (
          question.options.map((option) => (
            <label
              key={option.id}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                showResults
                  ? getOptionStyle(option.id)
                  : selectedAnswers.includes(option.id)
                  ? "border-purple-500 bg-purple-950/30"
                  : "border-zinc-700 hover:border-zinc-600"
              )}
            >
              <Checkbox
                checked={selectedAnswers.includes(option.id)}
                onCheckedChange={(checked) =>
                  !showResults && handleMultiSelect(option.id, checked as boolean)
                }
                disabled={showResults}
              />
              <span className="text-zinc-200">{option.text}</span>
            </label>
          ))
        ) : (
          <RadioGroup
            value={selectedAnswers[0] || ""}
            onValueChange={showResults ? undefined : handleSingleSelect}
            disabled={showResults}
          >
            {question.options.map((option) => (
              <label
                key={option.id}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                  showResults
                    ? getOptionStyle(option.id)
                    : selectedAnswers[0] === option.id
                    ? "border-purple-500 bg-purple-950/30"
                    : "border-zinc-700 hover:border-zinc-600"
                )}
              >
                <RadioGroupItem value={option.id} />
                <span className="text-zinc-200">{option.text}</span>
              </label>
            ))}
          </RadioGroup>
        )}
      </div>

      {showResults && result?.explanation && (
        <div className="mt-4 p-4 rounded-lg bg-blue-950/30 border border-blue-800/50">
          <p className="text-sm text-blue-300">
            <strong>Explanation:</strong> {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function ResultsSummary({
  score,
  passed,
  passingScore,
  totalQuestions,
  correctCount,
  attemptNumber,
  bestScore,
  allowRetakes,
  onRetake,
  nextItemPath,
}: {
  score: number;
  passed: boolean;
  passingScore: number;
  totalQuestions: number;
  correctCount: number;
  attemptNumber: number;
  bestScore: number;
  allowRetakes: boolean;
  onRetake: () => void;
  nextItemPath?: string;
}) {
  const router = useRouter();

  return (
    <div className="text-center py-8">
      <div
        className={cn(
          "inline-flex items-center justify-center w-20 h-20 rounded-full mb-4",
          passed ? "bg-green-950/50" : "bg-amber-950/50"
        )}
      >
        {passed ? (
          <Trophy className="h-10 w-10 text-green-400" />
        ) : (
          <AlertCircle className="h-10 w-10 text-amber-400" />
        )}
      </div>

      <h2 className="text-2xl font-bold text-zinc-100 mb-2">
        {passed ? "Well Done!" : "Keep Practicing!"}
      </h2>

      <div className="text-5xl font-bold text-zinc-100 mb-2">{score}%</div>

      <p className="text-zinc-400 mb-4">
        You got {correctCount} out of {totalQuestions} correct
      </p>

      {!passed && (
        <p className="text-amber-400 text-sm mb-4">
          You need {passingScore}% to pass. Your best score is {bestScore}%.
        </p>
      )}

      <p className="text-zinc-500 text-sm mb-6">Attempt #{attemptNumber}</p>

      <div className="flex items-center justify-center gap-3">
        {allowRetakes && (
          <Button variant="outline" onClick={onRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {passed && nextItemPath && (
          <Button onClick={() => router.push(nextItemPath)}>
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function QuizPlayer({
  courseId,
  moduleId,
  itemId,
  enrollmentId,
  onComplete,
  nextItemPath,
}: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<QuizContent | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistory[]>([]);
  const [bestScore, setBestScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        setLoading(true);

        // Fetch quiz content
        const res = await fetch(`/api/elite/items/${itemId}/quiz`);
        if (!res.ok) throw new Error("Failed to load quiz");
        const data = await res.json();
        setQuiz(data);

        // Fetch attempt history
        const historyRes = await fetch(
          `/api/elite/items/${itemId}/quiz/history?enrollmentId=${enrollmentId}`
        );
        if (historyRes.ok) {
          const history = await historyRes.json();
          setAttemptHistory(history.attempts || []);
          setBestScore(history.bestScore || 0);
        }

        // Start a new attempt
        await startNewAttempt();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [itemId, enrollmentId]);

  const startNewAttempt = async () => {
    try {
      const res = await fetch(`/api/elite/items/${itemId}/quiz/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      if (!res.ok) throw new Error("Failed to start quiz");
      const data = await res.json();
      setAttemptId(data.id);
      setAnswers(new Map());
      setSubmissionResult(null);
      setCurrentQuestion(0);
    } catch (err) {
      console.error("Failed to start attempt:", err);
    }
  };

  const handleAnswerChange = (questionId: string, selectedAnswers: string[]) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, selectedAnswers);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!attemptId || !quiz) return;

    try {
      setSubmitting(true);

      const answersArray = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedAnswers: answers.get(q.id) || [],
      }));

      const res = await fetch(`/api/elite/items/${itemId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: answersArray,
          enrollmentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit quiz");
      const result = await res.json();
      setSubmissionResult(result);

      // Update best score
      if (result.score > bestScore) {
        setBestScore(result.score);
      }

      // Update attempt history
      setAttemptHistory((prev) => [
        {
          id: attemptId,
          score: result.score,
          attemptNumber: prev.length + 1,
          completedAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      if (result.itemCompleted) {
        onComplete?.();
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = async () => {
    await startNewAttempt();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error || "Quiz not found"}</p>
      </div>
    );
  }

  const questions = quiz.questions;
  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion >= totalQuestions - 1;
  const hasAnsweredCurrent = (answers.get(currentQ?.id) || []).length > 0;
  const allAnswered = questions.every(
    (q) => (answers.get(q.id) || []).length > 0
  );

  // Show results view
  if (submissionResult) {
    const correctCount = submissionResult.results.filter((r) => r.correct).length;

    return (
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <Brain className="h-4 w-4" />
            <span>Learn It</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{quiz.title}</h1>
        </div>

        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
          <ResultsSummary
            score={submissionResult.score}
            passed={submissionResult.passed}
            passingScore={quiz.passingScore}
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            attemptNumber={attemptHistory.length}
            bestScore={bestScore}
            allowRetakes={quiz.allowRetakes}
            onRetake={handleRetake}
            nextItemPath={nextItemPath}
          />

          {/* Review answers */}
          <div className="mt-8 pt-8 border-t border-zinc-800 space-y-8">
            <h3 className="text-lg font-semibold text-zinc-100">
              Review Your Answers
            </h3>
            {questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                questionNumber={index + 1}
                totalQuestions={totalQuestions}
                selectedAnswers={answers.get(question.id) || []}
                onAnswerChange={() => {}}
                result={submissionResult.results.find(
                  (r) => r.questionId === question.id
                )}
                showResults={true}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
          <Brain className="h-4 w-4" />
          <span>Learn It</span>
          {bestScore > 0 && (
            <span className="text-zinc-500">
              Best Score: {bestScore}%
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-zinc-400 mt-2">{quiz.description}</p>
        )}
        <p className="text-sm text-zinc-500 mt-2">
          Pass requirement: {quiz.passingScore}%
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-400">Progress</span>
          <span className="text-zinc-400">
            {answers.size} of {totalQuestions} answered
          </span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-300"
            style={{
              width: `${(answers.size / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6">
        <QuestionCard
          question={currentQ}
          questionNumber={currentQuestion + 1}
          totalQuestions={totalQuestions}
          selectedAnswers={answers.get(currentQ.id) || []}
          onAnswerChange={(selected) =>
            handleAnswerChange(currentQ.id, selected)
          }
          showResults={false}
        />
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            disabled={!hasAnsweredCurrent}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question dots for navigation */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              index === currentQuestion
                ? "bg-purple-500 scale-110"
                : (answers.get(q.id) || []).length > 0
                ? "bg-purple-500/50"
                : "bg-zinc-700 hover:bg-zinc-600"
            )}
            title={`Question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

