import type { SupabaseClient } from "../../db/supabase.client";
import type {
  SessionSummary,
  SessionDetailResponse,
  QuestionResponse,
  AnswerItem,
} from "../../types";

interface SessionSelectResult {
  id: string;
  created_at: string;
  completed_at: string | null;
}

interface GetSessionsResult {
  sessions: SessionSummary[];
  total: number;
}

/**
 * Fetches paginated list of user's completed sessions.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user whose sessions to fetch
 * @param limit - Number of sessions to return (1-50)
 * @param offset - Number of sessions to skip
 * @returns Object with sessions array and total count
 * @throws Error if database query fails
 */
export async function getUserSessions(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  offset: number
): Promise<GetSessionsResult> {
  // Query for sessions with pagination
  const { data, error, count } = await supabase
    .from("sessions")
    .select("id, created_at, completed_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const sessions: SessionSummary[] = (data ?? []).map((row: SessionSelectResult) => ({
    id: row.id,
    created_at: row.created_at,
    completed_at: row.completed_at ?? row.created_at, // fallback for null
  }));

  return {
    sessions,
    total: count ?? 0,
  };
}

// =============================================================================
// POST /api/sessions functions
// =============================================================================

/**
 * Checks for duplicate question_id values in the answers array.
 *
 * @param answers - Array of answer items to check
 * @returns The duplicate question_id if found, null otherwise
 */
export function findDuplicateQuestionId(answers: AnswerItem[]): string | null {
  const seen = new Set<string>();
  for (const answer of answers) {
    if (seen.has(answer.question_id)) {
      return answer.question_id;
    }
    seen.add(answer.question_id);
  }
  return null;
}

/**
 * Validates answers against questions from the database.
 * Checks that each question_id exists and each answer_id is a valid option.
 *
 * @param answers - Array of answer items to validate
 * @param questions - Array of questions from the database
 * @returns Object with error message if validation fails, null otherwise
 */
export function validateAnswersAgainstQuestions(
  answers: AnswerItem[],
  questions: QuestionResponse[]
): { error: string } | null {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  for (const answer of answers) {
    const question = questionMap.get(answer.question_id);

    if (!question) {
      return { error: `Invalid question_id: ${answer.question_id}` };
    }

    const validOption = question.options.find((opt) => opt.id === answer.answer_id);

    if (!validOption) {
      return {
        error: `Invalid answer_id: ${answer.answer_id} for question: ${answer.question_id}`,
      };
    }
  }

  return null;
}

/**
 * Generates SOW fragments based on the user's answers.
 * Fragments are sorted according to question_order.
 *
 * @param answers - Array of validated answer items
 * @param questions - Array of questions from the database
 * @returns Array of SOW fragment strings in question order
 */
export function generateSowFragments(
  answers: AnswerItem[],
  questions: QuestionResponse[]
): string[] {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Sort answers by question_order
  const sortedAnswers = [...answers].sort((a, b) => {
    const qA = questionMap.get(a.question_id)!;
    const qB = questionMap.get(b.question_id)!;
    return qA.question_order - qB.question_order;
  });

  return sortedAnswers.map((answer) => {
    const question = questionMap.get(answer.question_id)!;
    const option = question.options.find((opt) => opt.id === answer.answer_id)!;
    return option.sow_fragment;
  });
}

/**
 * Creates a new session in the database with answers and generated fragments.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param userId - UUID of the user creating the session
 * @param answers - Array of validated answer items
 * @param generatedFragments - Array of generated SOW fragments
 * @returns The created session detail response
 * @throws Error if database insert fails
 */
export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  answers: AnswerItem[],
  generatedFragments: string[]
): Promise<SessionDetailResponse> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      answers: answers,
      generated_fragments: generatedFragments,
      completed_at: now,
    })
    .select("id, user_id, created_at, completed_at, answers, generated_fragments")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    created_at: data.created_at,
    completed_at: data.completed_at ?? data.created_at,
    answers: data.answers as AnswerItem[],
    generated_fragments: data.generated_fragments,
  };
}

// =============================================================================
// GET /api/sessions/[id] functions
// =============================================================================

/**
 * Fetches a single session by ID.
 * RLS ensures the user can only access their own sessions.
 *
 * @param supabase - Supabase client instance from context.locals
 * @param sessionId - UUID of the session to fetch
 * @returns SessionDetailResponse if found, null otherwise
 * @throws Error if database query fails
 */
export async function getSessionById(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionDetailResponse | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, user_id, created_at, completed_at, answers, generated_fragments")
    .eq("id", sessionId)
    .single();

  if (error) {
    // PGRST116 = no rows returned (not an error, just not found)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    created_at: data.created_at,
    completed_at: data.completed_at ?? data.created_at,
    answers: data.answers as AnswerItem[],
    generated_fragments: data.generated_fragments,
  };
}
