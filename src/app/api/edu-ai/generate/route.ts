import { NextRequest, NextResponse } from 'next/server';

interface GeneratePayload {
  subject: string;
  grade: string;
  board: string;
  topic: string;
  mode: 'LESSON_PLAN' | 'QUIZ';
}

export async function POST(req: NextRequest) {
  try {
    const body: GeneratePayload = await req.json();
    const { subject, grade, board, topic, mode } = body;

    if (!topic || topic.trim() === '') {
      return NextResponse.json({ error: 'Topic is required to generate curriculum content.' }, { status: 400 });
    }

    const cleanTopic = topic.trim();
    const cleanSubject = subject || 'General Science';
    const cleanGrade = grade || 'Grade 10';
    const cleanBoard = board || 'CBSE';

    if (mode === 'LESSON_PLAN') {
      const lessonPlan = {
        title: `${cleanSubject}: ${cleanTopic}`,
        subject: cleanSubject,
        grade: cleanGrade,
        board: cleanBoard,
        duration: '45 Minutes',
        pedagogyFramework: `${cleanBoard} Competency-Based Learning & Inquiry Model`,
        learningObjectives: [
          `Articulate the foundational principles and mechanisms governing ${cleanTopic}.`,
          `Analyze real-world case studies demonstrating ${cleanTopic} in practical scenarios.`,
          `Synthesize findings and solve quantitative / conceptual problem sets with peer collaboration.`,
          `Demonstrate conceptual mastery by formulating hypothesis statements and answering critical-thinking questions.`
        ],
        priorKnowledge: [
          `Basic vocabulary and prerequisite concepts covered in previous terms of ${cleanSubject}.`,
          `Standard scientific / analytical observation skills and diagrammatic interpretation.`,
          `Familiarity with lab safety or problem-solving notations.`
        ],
        vocabulary: [
          { term: `${cleanTopic.split(' ')[0] || 'Core'} Factor`, definition: `The primary independent variable or fundamental driver in ${cleanTopic}.` },
          { term: 'Equilibrium State', definition: 'The balanced condition where competing influences reach dynamic stability.' },
          { term: 'Empirical Verification', definition: 'The process of confirming hypotheses through structured observation and repeatable data.' },
          { term: 'Systemic Feedback', definition: 'The cyclical response loop where outputs re-influence initial parameters.' }
        ],
        timeline: [
          {
            phase: 'Hook & Real-World Wonder (0-7 min)',
            duration: '7 min',
            teacherActivity: `Presents an intriguing real-world paradox or video demonstration related to ${cleanTopic}. Prompts students with: "Why does this phenomenon occur in nature/industry?"`,
            studentActivity: 'Turn-and-talk in pairs for 90 seconds, noting 2 speculative explanations on their digital school diary or notebook.'
          },
          {
            phase: 'Direct Concept Modeling & In-depth Inquiry (8-22 min)',
            duration: '15 min',
            teacherActivity: `Walks through the core framework of ${cleanTopic} on the board. Uses visual schematics and step-by-step mathematical/analytical proofs.`,
            studentActivity: 'Active Cornell note-taking, sketching process diagrams, and identifying cause-and-effect links.'
          },
          {
            phase: 'Guided Collaborative Lab / Problem Solving (23-35 min)',
            duration: '13 min',
            teacherActivity: 'Circulates between pods of 4 students, offering scaffolding hints and verifying mastery against the board assessment criteria.',
            studentActivity: 'Groups tackle a tiered problem set; each student is assigned a specific role (Data Scribe, Proof Checker, Presenter, Timekeeper).'
          },
          {
            phase: 'Synthesis & Exit Ticket Check (36-45 min)',
            duration: '10 min',
            teacherActivity: 'Calls on 2 randomized students for 60-second lightning takeaways. Collects digital exit ticket responses via NexEdu student portal.',
            studentActivity: 'Completes a 3-question rapid formative check on their device or paper slip before leaving the classroom.'
          }
        ],
        differentiatedInstruction: {
          support: `Provide a graphic organizer with pre-filled terminology and scaffolding sentence-starters for students needing extra language/calculation support.`,
          extension: `Challenge accelerated learners to model edge cases or derive secondary equations connecting ${cleanTopic} to interdisciplinary domains.`
        },
        homeworkRecommendation: {
          title: `Diagnostic Application Challenge: ${cleanTopic}`,
          prompt: `Compose a 250-word synthesis evaluating how ${cleanTopic} is utilized in modern technological or ecological systems. Include one original diagram and solve Problems 1–4.`,
          estimatedTime: '30-40 mins'
        }
      };

      return NextResponse.json({ success: true, mode: 'LESSON_PLAN', data: lessonPlan });
    } else {
      // QUIZ & RUBRIC GENERATOR
      const quiz = {
        title: `Comprehensive Mastery Assessment: ${cleanTopic}`,
        subject: cleanSubject,
        grade: cleanGrade,
        board: cleanBoard,
        totalMarks: 25,
        estimatedTime: '35 Minutes',
        instructions: [
          'Answer all questions carefully.',
          'For multiple-choice questions, choose the single best answer.',
          'Show clear steps and reasoning for short-answer questions to earn full partial credit.',
          'Maintain academic honesty under the NexEdu Honor Code.'
        ],
        questions: [
          {
            id: 'Q1',
            type: 'MCQ',
            prompt: `Which of the following best defines the primary principle underlying ${cleanTopic}?`,
            options: [
              `A) It functions as an isolated closed system unaffected by environmental variables.`,
              `B) It represents dynamic equilibrium where rate of forward activity equals reverse feedback.`,
              `C) It solely applies to theoretical models with no practical physical application.`,
              `D) It operates without requiring energy transfer or foundational catalyst forces.`
            ],
            correctAnswer: `B) It represents dynamic equilibrium where rate of forward activity equals reverse feedback.`,
            explanation: `In standard ${cleanBoard} curriculum, ${cleanTopic} emphasizes balanced reciprocal mechanisms and conservation laws.`,
            marks: 2
          },
          {
            id: 'Q2',
            type: 'MCQ',
            prompt: `When conditions undergo a 20% increase in baseline resistance during an observation of ${cleanTopic}, what is the expected outcome?`,
            options: [
              `A) The system immediately experiences catastrophic failure.`,
              `B) The reaction rate or efficiency shifts predictably according to governing rate laws.`,
              `C) No measurable variance occurs under any circumstances.`,
              `D) All prerequisite components reverse their charge/polarity.`
            ],
            correctAnswer: `B) The reaction rate or efficiency shifts predictably according to governing rate laws.`,
            explanation: `Standard perturbation theory within ${cleanSubject} states that proportional variances alter system equilibrium along governed rate curves.`,
            marks: 2
          },
          {
            id: 'Q3',
            type: 'MCQ',
            prompt: `In an empirical investigation of ${cleanTopic}, what serves as the crucial control parameter?`,
            options: [
              `A) Randomly fluctuating background temperature.`,
              `B) The unmanipulated baseline sample kept under standardized ambient conditions.`,
              `C) The qualitative emotional sentiment of the testing group.`,
              `D) An uncalibrated external measurement device.`
            ],
            correctAnswer: `B) The unmanipulated baseline sample kept under standardized ambient conditions.`,
            explanation: `Scientific method protocols mandate maintaining an unmanipulated baseline to isolate the causality of the experimental treatment.`,
            marks: 2
          },
          {
            id: 'Q4',
            type: 'SHORT_ANSWER',
            prompt: `Explain the fundamental mechanism of ${cleanTopic}. Provide two concrete real-world applications or historical instances where this concept proved decisive.`,
            correctAnswer: `Comprehensive explanation showing: (1) Accurate definition of governing mechanism; (2) Two distinct real-world applications with clear operational links; (3) Appropriate use of domain-specific terminology.`,
            explanation: `Full marks awarded for structured responses demonstrating conceptual clarity, technical terminology, and contextual validity.`,
            marks: 5
          },
          {
            id: 'Q5',
            type: 'SHORT_ANSWER',
            prompt: `A researcher observes an unexpected anomaly while graphing data from ${cleanTopic}. Propose an explanatory hypothesis and describe a diagnostic experiment to test your hypothesis.`,
            correctAnswer: `Clear testable hypothesis identifying a plausible confounding variable, accompanied by an experimental protocol with independent, dependent, and controlled variables.`,
            explanation: `Evaluates higher-order inquiry skills per Bloom's Taxonomy (Evaluation & Synthesis).`,
            marks: 6
          },
          {
            id: 'Q6',
            type: 'SHORT_ANSWER',
            prompt: `Synthesize how modern advancements in technology have transformed how we measure or apply ${cleanTopic} compared to 20th-century classical methods.`,
            correctAnswer: `Discussion citing automated sensors, digital simulation, higher precision instrumentation, or sustainable ecological practices.`,
            explanation: `Tests interdisciplinary understanding aligned with 2026 educational standards.`,
            marks: 8
          }
        ],
        gradingRubric: [
          {
            criterion: 'Conceptual Accuracy & Precision',
            exemplary: 'Demonstrates thorough, sophisticated understanding with flawless terminology and zero misconceptions.',
            proficient: 'Demonstrates solid grasp of core principles with minor terminological gaps that do not hinder understanding.',
            developing: 'Shows partial understanding with some significant factual errors or conceptual confusion.'
          },
          {
            criterion: 'Scientific / Analytical Reasoning',
            exemplary: 'Flawlessly articulates cause-and-effect relationships and provides insightful experimental designs.',
            proficient: 'Logically connects concepts with adequate justification and reasonable experimental proposals.',
            developing: 'Arguments are disconnected or rely on unsubstantiated assumptions.'
          },
          {
            criterion: 'Clarity & Communication',
            exemplary: 'Written with exceptional clarity, clean structural formatting, and precise scholarly voice.',
            proficient: 'Clear and readable with organized paragraphs and appropriate vocabulary.',
            developing: 'Fragmented answers with vague phrasing or incomplete problem-solving steps.'
          }
        ]
      };

      return NextResponse.json({ success: true, mode: 'QUIZ', data: quiz });
    }
  } catch (error: any) {
    console.error('EduAI generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate curriculum artifact.' }, { status: 500 });
  }
}
