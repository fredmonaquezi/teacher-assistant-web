import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ClassDetailPage from "./pages/ClassDetailPage";
import AttendancePage from "./pages/AttendancePage";
import AssessmentDetailPage from "./pages/AssessmentDetailPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import RandomPickerPage from "./pages/RandomPickerPage";
import RunningRecordsPage from "./pages/RunningRecordsPage";
import { supabase } from "./supabaseClient";
import {
  DEFAULT_PROFILE_PREFERENCES,
  STUDENT_GENDER_OPTIONS,
} from "./constants/options";
import {
  averageFromPercents,
  entryToPercent,
  getAssessmentMaxScore,
  performanceColor,
  scoreToPercent,
} from "./utils/assessmentMetrics";
import "./App.css";
import "react-day-picker/dist/style.css";

const DEFAULT_RUBRICS = [
  {
    title: "Primary English Language (Years 1-3)",
    gradeBand: "Years 1-3",
    subject: "English",
    categories: [
      {
        name: "Listening and Comprehension",
        criteria: [
          { label: "Follows Class Instructions", description: "Student listens and follows multi-step directions" },
          { label: "Understands Spoken Narratives", description: "Comprehends stories and explanations" },
          { label: "Identifies Key Vocabulary", description: "Recognizes important words in context" },
          { label: "Responds Appropriately", description: "Gives relevant answers to questions" },
        ],
      },
      {
        name: "Speaking and Oral Production",
        criteria: [
          { label: "Clarity and Pronunciation", description: "Speaks clearly and pronounces words correctly" },
          { label: "Vocabulary Use", description: "Uses appropriate and varied vocabulary" },
          { label: "Sentence Structure", description: "Forms complete and grammatically correct sentences" },
          { label: "Participation & Confidence", description: "Actively participates and speaks confidently" },
        ],
      },
      {
        name: "Reading and Comprehension",
        criteria: [
          { label: "Decoding & Phonics", description: "Applies phonics skills to decode unfamiliar words" },
          { label: "Reading Fluency & Pace", description: "Reads smoothly and at appropriate speed" },
          { label: "Understanding Text", description: "Comprehends and interprets reading material" },
          { label: "Vocabulary Acquisition from Reading", description: "Learns new words through reading" },
        ],
      },
      {
        name: "Writing Skills",
        criteria: [
          { label: "Legibility & Spelling", description: "Writes neatly and spells words correctly" },
          { label: "Grammar & Punctuation", description: "Uses proper grammar and punctuation" },
          { label: "Idea Organization & Expression", description: "Organizes thoughts and expresses ideas clearly" },
          { label: "Vocabulary in Writing", description: "Uses varied and appropriate vocabulary in writing" },
        ],
      },
    ],
  },
  {
    title: "Primary General Development (Years 1-3)",
    gradeBand: "Years 1-3",
    subject: "General",
    categories: [
      {
        name: "Social-Emotional Development",
        criteria: [
          { label: "Works Well with Others", description: "Collaborates effectively and respectfully" },
          { label: "Manages Emotions Appropriately", description: "Handles frustration and excitement well" },
          { label: "Shows Respect & Kindness", description: "Treats peers and adults with respect" },
          { label: "Follows Classroom Rules", description: "Adheres to class expectations" },
        ],
      },
      {
        name: "Work Habits",
        criteria: [
          { label: "Completes Tasks on Time", description: "Finishes work within given timeframe" },
          { label: "Stays Organized", description: "Keeps materials and work area organized" },
          { label: "Shows Effort & Persistence", description: "Tries hard and doesn't give up easily" },
          { label: "Asks for Help When Needed", description: "Seeks assistance appropriately" },
        ],
      },
    ],
  },
  {
    title: "Primary Mathematics (Years 1-3)",
    gradeBand: "Years 1-3",
    subject: "Math",
    categories: [
      {
        name: "Number Sense",
        criteria: [
          { label: "Counting & Number Recognition", description: "Identifies and counts numbers accurately" },
          { label: "Basic Operations", description: "Performs addition and subtraction" },
          { label: "Number Patterns", description: "Recognizes and extends patterns" },
          { label: "Place Value Understanding", description: "Understands ones, tens, hundreds" },
        ],
      },
      {
        name: "Problem Solving",
        criteria: [
          { label: "Word Problem Comprehension", description: "Understands what the problem is asking" },
          { label: "Strategy Selection", description: "Chooses appropriate solving methods" },
          { label: "Shows Work", description: "Demonstrates thinking process" },
          { label: "Checks Answers", description: "Verifies solutions make sense" },
        ],
      },
    ],
  },
  {
    title: "Intermediate English Language (Years 4-6)",
    gradeBand: "Years 4-6",
    subject: "English",
    categories: [
      {
        name: "Reading and Analysis",
        criteria: [
          { label: "Comprehension of Complex Texts", description: "Understands multi-layered narratives" },
          { label: "Inference & Interpretation", description: "Reads between the lines and draws conclusions" },
          { label: "Literary Elements Recognition", description: "Identifies themes, characters, plot structure" },
          { label: "Critical Reading", description: "Questions and evaluates what they read" },
        ],
      },
      {
        name: "Writing and Composition",
        criteria: [
          { label: "Paragraph Structure", description: "Writes well-organized paragraphs with topic sentences" },
          { label: "Genre Writing", description: "Writes effectively in different formats (narrative, informative, persuasive)" },
          { label: "Editing & Revision", description: "Reviews and improves own writing" },
          { label: "Voice & Style", description: "Develops personal writing style" },
        ],
      },
      {
        name: "Speaking and Presentation",
        criteria: [
          { label: "Oral Presentation Skills", description: "Presents information clearly and confidently" },
          { label: "Listening & Responding", description: "Actively listens and responds thoughtfully" },
          { label: "Discussion Participation", description: "Contributes meaningfully to class discussions" },
          { label: "Questioning Skills", description: "Asks relevant and thoughtful questions" },
        ],
      },
    ],
  },
  {
    title: "Intermediate General Development (Years 4-6)",
    gradeBand: "Years 4-6",
    subject: "General",
    categories: [
      {
        name: "Critical Thinking",
        criteria: [
          { label: "Analyzes Information", description: "Breaks down complex information" },
          { label: "Makes Connections", description: "Links new learning to prior knowledge" },
          { label: "Asks Thoughtful Questions", description: "Inquires deeply about topics" },
          { label: "Evaluates Evidence", description: "Considers quality of information" },
        ],
      },
      {
        name: "Independence & Responsibility",
        criteria: [
          { label: "Self-Directed Learning", description: "Takes initiative in learning" },
          { label: "Time Management", description: "Manages time and meets deadlines" },
          { label: "Organization", description: "Keeps materials and assignments organized" },
          { label: "Goal Setting", description: "Sets and works toward personal goals" },
        ],
      },
      {
        name: "Collaboration",
        criteria: [
          { label: "Teamwork", description: "Works effectively in groups" },
          { label: "Communication", description: "Expresses ideas clearly to peers" },
          { label: "Conflict Resolution", description: "Resolves disagreements constructively" },
          { label: "Leadership", description: "Takes appropriate leadership roles" },
        ],
      },
    ],
  },
  {
    title: "Intermediate Mathematics (Years 4-6)",
    gradeBand: "Years 4-6",
    subject: "Math",
    categories: [
      {
        name: "Numerical Skills",
        criteria: [
          { label: "Multi-digit Operations", description: "Performs complex calculations accurately" },
          { label: "Fractions & Decimals", description: "Understands and works with rational numbers" },
          { label: "Mental Math", description: "Calculates efficiently without paper" },
          { label: "Estimation", description: "Makes reasonable approximations" },
        ],
      },
      {
        name: "Mathematical Thinking",
        criteria: [
          { label: "Problem Solving Strategies", description: "Uses multiple approaches to solve problems" },
          { label: "Logical Reasoning", description: "Explains mathematical thinking clearly" },
          { label: "Pattern Recognition", description: "Identifies and uses mathematical patterns" },
          { label: "Real-World Application", description: "Applies math to practical situations" },
        ],
      },
    ],
  },
  {
    title: "Secondary English Language Arts (Years 7-9)",
    gradeBand: "Years 7-9",
    subject: "English",
    categories: [
      {
        name: "Literary Analysis",
        criteria: [
          { label: "Textual Analysis", description: "Analyzes themes, symbolism, and literary devices" },
          { label: "Character & Plot Analysis", description: "Examines character development and narrative structure" },
          { label: "Historical & Cultural Context", description: "Considers texts within broader contexts" },
          { label: "Comparative Analysis", description: "Compares and contrasts multiple texts" },
        ],
      },
      {
        name: "Academic Writing",
        criteria: [
          { label: "Thesis Development", description: "Creates clear, arguable thesis statements" },
          { label: "Evidence & Citations", description: "Supports claims with textual evidence" },
          { label: "Essay Organization", description: "Structures multi-paragraph essays effectively" },
          { label: "Academic Voice", description: "Maintains formal, objective tone" },
        ],
      },
      {
        name: "Research Skills",
        criteria: [
          { label: "Source Evaluation", description: "Assesses credibility of sources" },
          { label: "Note-Taking", description: "Records information effectively" },
          { label: "Synthesis", description: "Combines information from multiple sources" },
          { label: "Documentation", description: "Cites sources properly" },
        ],
      },
    ],
  },
  {
    title: "Secondary General Development (Years 7-9)",
    gradeBand: "Years 7-9",
    subject: "General",
    categories: [
      {
        name: "Academic Skills",
        criteria: [
          { label: "Study Skills", description: "Uses effective study strategies" },
          { label: "Note-Taking", description: "Takes organized, comprehensive notes" },
          { label: "Test Preparation", description: "Prepares thoroughly for assessments" },
          { label: "Academic Integrity", description: "Maintains honesty in all work" },
        ],
      },
      {
        name: "Digital Literacy",
        criteria: [
          { label: "Technology Use", description: "Uses technology effectively for learning" },
          { label: "Online Research", description: "Conducts effective internet research" },
          { label: "Digital Citizenship", description: "Acts responsibly online" },
          { label: "Media Literacy", description: "Critically evaluates digital media" },
        ],
      },
      {
        name: "Problem-Solving & Creativity",
        criteria: [
          { label: "Creative Thinking", description: "Generates original ideas and solutions" },
          { label: "Critical Analysis", description: "Evaluates problems from multiple angles" },
          { label: "Persistence", description: "Perseveres through challenging tasks" },
          { label: "Innovation", description: "Applies creative solutions to problems" },
        ],
      },
    ],
  },
  {
    title: "Secondary Mathematics (Years 7-9)",
    gradeBand: "Years 7-9",
    subject: "Math",
    categories: [
      {
        name: "Algebraic Thinking",
        criteria: [
          { label: "Variables & Expressions", description: "Works with algebraic expressions" },
          { label: "Equation Solving", description: "Solves linear equations" },
          { label: "Graphing", description: "Represents relationships graphically" },
          { label: "Functions", description: "Understands function concepts" },
        ],
      },
      {
        name: "Geometric Reasoning",
        criteria: [
          { label: "Spatial Visualization", description: "Visualizes and manipulates shapes" },
          { label: "Measurement", description: "Calculates area, volume, etc." },
          { label: "Geometric Proofs", description: "Constructs logical geometric arguments" },
          { label: "Transformations", description: "Understands translations, rotations, reflections" },
        ],
      },
    ],
  },
  {
    title: "High School English Language Arts (Years 10-12)",
    gradeBand: "Years 10-12",
    subject: "English",
    categories: [
      {
        name: "Advanced Literary Analysis",
        criteria: [
          { label: "Complex Textual Analysis", description: "Analyzes sophisticated literary works" },
          { label: "Critical Theory Application", description: "Applies literary criticism frameworks" },
          { label: "Intertextual Connections", description: "Makes connections across texts and media" },
          { label: "Independent Interpretation", description: "Develops original analytical perspectives" },
        ],
      },
      {
        name: "College-Level Writing",
        criteria: [
          { label: "Argumentative Writing", description: "Constructs sophisticated arguments" },
          { label: "Research Papers", description: "Produces formal research papers" },
          { label: "Rhetorical Analysis", description: "Analyzes rhetorical strategies" },
          { label: "Style & Sophistication", description: "Demonstrates mature writing style" },
        ],
      },
      {
        name: "Advanced Communication",
        criteria: [
          { label: "Formal Presentations", description: "Delivers polished presentations" },
          { label: "Debate & Discussion", description: "Engages in academic discourse" },
          { label: "Synthesis", description: "Integrates multiple perspectives" },
          { label: "Professional Communication", description: "Communicates in professional contexts" },
        ],
      },
    ],
  },
  {
    title: "High School College/Career Readiness (Years 10-12)",
    gradeBand: "Years 10-12",
    subject: "General",
    categories: [
      {
        name: "College/Career Readiness",
        criteria: [
          { label: "Academic Independence", description: "Works independently at college level" },
          { label: "Time Management", description: "Manages complex schedules and deadlines" },
          { label: "Long-Term Planning", description: "Plans and executes extended projects" },
          { label: "Professional Skills", description: "Demonstrates workplace-ready skills" },
        ],
      },
      {
        name: "Leadership & Initiative",
        criteria: [
          { label: "Leadership Roles", description: "Takes leadership in groups and activities" },
          { label: "Initiative", description: "Self-starts learning and projects" },
          { label: "Mentoring", description: "Supports and guides peers" },
          { label: "Community Engagement", description: "Contributes to broader community" },
        ],
      },
      {
        name: "Self-Management",
        criteria: [
          { label: "Goal Setting & Achievement", description: "Sets and achieves ambitious goals" },
          { label: "Stress Management", description: "Handles academic pressure effectively" },
          { label: "Self-Reflection", description: "Reflects on strengths and areas for growth" },
          { label: "Resilience", description: "Bounces back from setbacks" },
        ],
      },
      {
        name: "Global Awareness",
        criteria: [
          { label: "Cultural Awareness", description: "Understands diverse perspectives" },
          { label: "Social Responsibility", description: "Acts as responsible global citizen" },
          { label: "Ethical Reasoning", description: "Considers ethical implications" },
          { label: "Current Events Knowledge", description: "Stays informed about world issues" },
        ],
      },
    ],
  },
  {
    title: "High School Mathematics (Years 10-12)",
    gradeBand: "Years 10-12",
    subject: "Math",
    categories: [
      {
        name: "Advanced Algebra & Functions",
        criteria: [
          { label: "Complex Functions", description: "Works with polynomial, exponential, logarithmic functions" },
          { label: "Systems of Equations", description: "Solves complex equation systems" },
          { label: "Mathematical Modeling", description: "Creates mathematical models of real situations" },
          { label: "Abstract Reasoning", description: "Thinks abstractly about mathematical concepts" },
        ],
      },
      {
        name: "Calculus & Advanced Topics",
        criteria: [
          { label: "Limits & Continuity", description: "Understands limit concepts" },
          { label: "Rates of Change", description: "Analyzes changing quantities" },
          { label: "Integration", description: "Understands accumulation" },
          { label: "Mathematical Proof", description: "Constructs rigorous mathematical arguments" },
        ],
      },
    ],
  },
];

function RubricsPage({
  formError,
  rubrics,
  rubricCategories,
  rubricCriteria,
  loading,
  seedingRubrics,
  handleSeedDefaultRubrics,
  loadData,
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddCriterion, setShowAddCriterion] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: "",
    gradeBand: "",
    subject: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCriterionForm, setNewCriterionForm] = useState({
    label: "",
    description: "",
  });

  const normalizeSubject = (value) => (value || "").trim().toLowerCase();
  const subjectKind = (subject) => {
    const normalized = normalizeSubject(subject);
    if (["english", "inglês", "ingles"].includes(normalized)) return "english";
    if (["math", "mathematics", "matemática", "matematica"].includes(normalized)) return "math";
    if (["science", "ciência", "ciencia", "ciências", "ciencias"].includes(normalized)) return "science";
    if (["general", "geral"].includes(normalized)) return "general";
    return "default";
  };
  const renderRubricIcon = (kind) => {
    switch (kind) {
      case "header":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M6 4.5h10a2 2 0 0 1 2 2V19H8a2 2 0 0 1-2-2V4.5Z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 15l1.2 1.2L12.8 14" />
            <path d="M5 6.5h2v10H5z" />
          </svg>
        );
      case "level":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M3.5 9.2 12 5l8.5 4.2L12 13.5 3.5 9.2Z" />
            <path d="M7 11.2V14c0 1.8 2.4 3.2 5 3.2s5-1.4 5-3.2v-2.8" />
            <path d="M20.5 9.2v5.1" />
          </svg>
        );
      case "english":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M5 6a2 2 0 0 1 2-2h10v15H7a2 2 0 0 0-2 2V6Z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 15h4" />
          </svg>
        );
      case "math":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <rect x="5" y="4.5" width="14" height="15" rx="2.5" />
            <line x1="9" y1="8.5" x2="15" y2="8.5" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <path d="M10 15.5h4" />
          </svg>
        );
      case "science":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M9 4.5h6" />
            <path d="M10 4.5v5.4l-3.4 5.6a2.2 2.2 0 0 0 1.9 3.3h7a2.2 2.2 0 0 0 1.9-3.3L14 9.9V4.5" />
            <path d="M9 13h6" />
          </svg>
        );
      case "general":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="m12 5 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7L12 5Z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <rect x="6" y="4.5" width="12" height="15" rx="2" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 14h4" />
          </svg>
        );
    }
  };
  const subjectColor = (subject) => {
    const normalized = normalizeSubject(subject);
    if (["english", "inglês", "ingles"].includes(normalized)) return "#2563eb";
    if (["math", "mathematics", "matemática", "matematica"].includes(normalized)) return "#16a34a";
    if (["science", "ciência", "ciencia", "ciências", "ciencias"].includes(normalized)) return "#f97316";
    if (["general", "geral"].includes(normalized)) return "#7c3aed";
    return "#64748b";
  };

  const gradeLevels = useMemo(() => {
    const predefined = ["Years 1-3", "Years 4-6", "Years 7-9", "Years 10-12"];
    const extra = rubrics
      .map((rubric) => rubric.grade_band || "")
      .filter((value) => value.trim().length > 0);
    const ordered = [];
    const seen = new Set();
    for (const level of [...predefined, ...extra]) {
      const normalized = level.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }
    return ordered;
  }, [rubrics]);

  const templatesForLevel = (level) =>
    rubrics.filter((rubric) => (rubric.grade_band || "").trim() === level);

  const totalCriteria = (rubricId) => {
    const categories = rubricCategories.filter((c) => c.rubric_id === rubricId);
    const categoryIds = new Set(categories.map((c) => c.id));
    return rubricCriteria.filter((c) => categoryIds.has(c.category_id)).length;
  };

  const handleCreateTemplate = async () => {
    const payload = {
      title: newTemplateForm.title.trim(),
      grade_band: newTemplateForm.gradeBand.trim(),
      subject: newTemplateForm.subject.trim(),
    };
    if (!payload.title || !payload.grade_band || !payload.subject) return;
    const { error } = await supabase.from("rubrics").insert(payload);
    if (error) {
      return;
    }
    setNewTemplateForm({ title: "", gradeBand: "", subject: "" });
    setShowCreateTemplate(false);
    await loadData();
  };

  const handleUpdateTemplate = async (rubricId, updates) => {
    const { error } = await supabase.from("rubrics").update(updates).eq("id", rubricId);
    if (error) return;
    await loadData();
  };

  const handleDeleteTemplate = async (rubricId) => {
    if (!window.confirm("Delete this template?")) return;
    const { error } = await supabase.from("rubrics").delete().eq("id", rubricId);
    if (error) return;
    if (selectedTemplate?.id === rubricId) setSelectedTemplate(null);
    await loadData();
  };

  const handleCreateCategory = async () => {
    if (!selectedTemplate?.id) return;
    const name = newCategoryName.trim();
    if (!name) return;
    const { error } = await supabase.from("rubric_categories").insert({
      rubric_id: selectedTemplate.id,
      name,
      sort_order: rubricCategories.filter((c) => c.rubric_id === selectedTemplate.id).length,
    });
    if (error) return;
    setNewCategoryName("");
    setShowAddCategory(false);
    await loadData();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category and its criteria?")) return;
    const { error } = await supabase.from("rubric_categories").delete().eq("id", categoryId);
    if (error) return;
    await loadData();
  };

  const handleCreateCriterion = async () => {
    if (!showAddCriterion?.id) return;
    const label = newCriterionForm.label.trim();
    const description = newCriterionForm.description.trim();
    if (!label && !description) return;
    const { error } = await supabase.from("rubric_criteria").insert({
      category_id: showAddCriterion.id,
      label: label || null,
      description,
      sort_order: rubricCriteria.filter((c) => c.category_id === showAddCriterion.id).length,
    });
    if (error) return;
    setNewCriterionForm({ label: "", description: "" });
    setShowAddCriterion(null);
    await loadData();
  };

  const handleDeleteCriterion = async (criterionId) => {
    if (!window.confirm("Delete this criterion?")) return;
    const { error } = await supabase.from("rubric_criteria").delete().eq("id", criterionId);
    if (error) return;
    await loadData();
  };

  const handleUpdateCriterion = async () => {
    if (!editingCriterion?.id) return;
    const { error } = await supabase
      .from("rubric_criteria")
      .update({
        label: editingCriterion.label.trim() || null,
        description: editingCriterion.description.trim(),
      })
      .eq("id", editingCriterion.id);
    if (error) return;
    setEditingCriterion(null);
    await loadData();
  };

  const templateCategories = selectedTemplate
    ? rubricCategories.filter((c) => c.rubric_id === selectedTemplate.id)
    : [];

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel rubrics-page">
        <div className="rubrics-header-card">
          <div className="rubrics-header-icon" aria-hidden="true">{renderRubricIcon("header")}</div>
          <div className="rubrics-header-copy">
            <h2>Rubric Template Library</h2>
            <p className="muted">
              Browse, customize, and create development tracking templates.
            </p>
          </div>
        </div>

        <div className="rubrics-actions">
          <button type="button" onClick={() => setShowCreateTemplate(true)}>
            Create New
          </button>
          <button type="button" className="secondary" onClick={handleSeedDefaultRubrics} disabled={seedingRubrics}>
            {seedingRubrics ? "Seeding default rubrics..." : "Create default rubrics"}
          </button>
        </div>
        {seedingRubrics ? (
          <p className="rubrics-seeding-message" role="status" aria-live="polite">
            Creating default rubrics. This can take a few seconds...
          </p>
        ) : null}

        {loading ? (
          <p className="muted">Loading rubrics...</p>
        ) : (
          gradeLevels.map((level) => {
            const templates = templatesForLevel(level);
            if (!templates.length) return null;
            return (
              <div key={level} className="rubrics-section">
                <div className="rubrics-section-title">
                  {renderRubricIcon("level")}
                  <strong>{level}</strong>
                </div>
                <div className="rubrics-grid">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      className="rubric-card"
                      onClick={() => setSelectedTemplate(template)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTemplate(template);
                        }
                      }}
                    >
                      <div className="rubric-card-top">
                        <div
                          className="rubric-card-icon"
                          style={{ color: subjectColor(template.subject) }}
                        >
                          {renderRubricIcon(subjectKind(template.subject))}
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          aria-label="Delete template"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="rubric-card-subject" style={{ color: subjectColor(template.subject) }}>
                        {template.subject || "Subject"}
                      </div>
                      <div className="rubric-card-title">{template.title}</div>
                      <div className="rubric-card-stats">
                        <span>{rubricCategories.filter((c) => c.rubric_id === template.id).length} categories</span>
                        <span>{totalCriteria(template.id)} criteria</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {showCreateTemplate && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>Create New Template</h3>
            <p className="muted">Build a custom rubric from scratch.</p>
            <label className="stack">
              <span>Template Name</span>
              <input
                value={newTemplateForm.title}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Advanced Writing Skills"
              />
            </label>
            <label className="stack">
              <span>Grade Level</span>
              <input
                value={newTemplateForm.gradeBand}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, gradeBand: event.target.value }))
                }
                placeholder="Years 7-9"
              />
            </label>
            <label className="stack">
              <span>Subject</span>
              <input
                value={newTemplateForm.subject}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="English"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowCreateTemplate(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateTemplate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-editor">
            <div className="rubrics-editor-header">
              <div className="rubrics-editor-heading">
                <div
                  className="rubrics-editor-icon"
                  style={{ color: subjectColor(selectedTemplate.subject) }}
                >
                  {renderRubricIcon(subjectKind(selectedTemplate.subject))}
                </div>
                <div>
                  <div className="rubrics-editor-subject" style={{ color: subjectColor(selectedTemplate.subject) }}>
                    {selectedTemplate.subject || "Subject"}
                  </div>
                  <div className="rubrics-editor-title">{selectedTemplate.title}</div>
                  <div className="muted">{selectedTemplate.grade_band || "Grade band"}</div>
                </div>
              </div>
              <button
                type="button"
                className="icon-button rubrics-editor-close"
                onClick={() => setSelectedTemplate(null)}
                aria-label="Close rubric editor"
              >
                ×
              </button>
            </div>

            <div className="rubrics-info-card">
              <h4>Template Information</h4>
              <label className="stack">
                <span>Template Name</span>
                <input
                  value={selectedTemplate.title}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, title: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { title: event.target.value })
                  }
                />
              </label>
              <label className="stack">
                <span>Grade Level</span>
                <input
                  value={selectedTemplate.grade_band || ""}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, grade_band: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { grade_band: event.target.value })
                  }
                />
              </label>
              <label className="stack">
                <span>Subject</span>
                <input
                  value={selectedTemplate.subject || ""}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, subject: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { subject: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="rubrics-categories">
              <div className="rubrics-categories-header">
                <h4>Categories & Criteria</h4>
                <button type="button" className="link" onClick={() => setShowAddCategory(true)}>
                  Add Category
                </button>
              </div>

              {templateCategories.length === 0 ? (
                <div className="muted">No categories yet.</div>
              ) : (
                templateCategories.map((category) => {
                  const criteria = rubricCriteria
                    .filter((c) => c.category_id === category.id)
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                  return (
                    <div key={category.id} className="rubric-category-card">
                      <div className="rubric-category-header">
                        <div>
                          <strong>{category.name}</strong>
                          <span className="muted"> • {criteria.length} criteria</span>
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          ✕
                        </button>
                      </div>
                      {criteria.length === 0 ? (
                        <div className="muted">No criteria yet.</div>
                      ) : (
                        <ul className="rubric-criteria-list">
                          {criteria.map((criterion) => (
                            <li key={criterion.id}>
                              <div>
                                <strong>{criterion.label || "Criterion"}</strong>
                                {criterion.description ? (
                                  <div className="muted">{criterion.description}</div>
                                ) : null}
                              </div>
                              <div className="rubric-criteria-actions">
                                <button
                                  type="button"
                                  className="order-btn"
                                  onClick={() => setEditingCriterion({ ...criterion })}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() => handleDeleteCriterion(criterion.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="link"
                        onClick={() => setShowAddCriterion(category)}
                      >
                        Add Criterion
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions rubrics-editor-actions">
              <button type="button" className="secondary" onClick={() => setSelectedTemplate(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>New Category</h3>
            <p className="muted">Add a new category to organize criteria.</p>
            <label className="stack">
              <span>Category Name</span>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Critical Thinking"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddCategory(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCriterion && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>New Criterion</h3>
            <p className="muted">Add a new skill to track in {showAddCriterion.name}.</p>
            <label className="stack">
              <span>Criterion Name</span>
              <input
                value={newCriterionForm.label}
                onChange={(event) =>
                  setNewCriterionForm((prev) => ({ ...prev, label: event.target.value }))
                }
                placeholder="Critical Thinking Skills"
              />
            </label>
            <label className="stack">
              <span>Description (Optional)</span>
              <input
                value={newCriterionForm.description}
                onChange={(event) =>
                  setNewCriterionForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Analyzes information and draws conclusions"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddCriterion(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCriterion}
                disabled={!newCriterionForm.label.trim() && !newCriterionForm.description.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCriterion && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>Edit Criterion</h3>
            <label className="stack">
              <span>Criterion Name</span>
              <input
                value={editingCriterion.label || ""}
                onChange={(event) =>
                  setEditingCriterion((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </label>
            <label className="stack">
              <span>Description</span>
              <input
                value={editingCriterion.description || ""}
                onChange={(event) =>
                  setEditingCriterion((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setEditingCriterion(null)}>
                Cancel
              </button>
              <button type="button" onClick={handleUpdateCriterion}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function useReorderMode() {
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 720px)").matches : false
  );
  const [isReorderMode, setIsReorderMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const handleChange = (event) => setIsMobileLayout(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const effectiveReorderMode = isMobileLayout ? isReorderMode : false;

  return {
    isMobileLayout,
    isReorderMode: effectiveReorderMode,
    setIsReorderMode,
    isReorderEnabled: !isMobileLayout || effectiveReorderMode,
  };
}

function useHandleDrag(isEnabled) {
  const readyDragIdRef = useRef(null);
  const pendingPressRef = useRef(null);
  const holdTimerRef = useRef(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const resetHandleDrag = useCallback(() => {
    clearHoldTimer();
    readyDragIdRef.current = null;
    pendingPressRef.current = null;
  }, [clearHoldTimer]);

  const armDragByMovement = useCallback((event) => {
    if (!pendingPressRef.current) return;
    if (pendingPressRef.current.pointerId !== event.pointerId) return;
    const distanceX = event.clientX - pendingPressRef.current.startX;
    const distanceY = event.clientY - pendingPressRef.current.startY;
    const moved = Math.hypot(distanceX, distanceY);
    if (moved < 6) return;
    readyDragIdRef.current = pendingPressRef.current.id;
    clearHoldTimer();
  }, [clearHoldTimer]);

  const onHandlePointerDown = useCallback((id, event) => {
    if (!isEnabled) return;
    if (event.button !== 0 && event.pointerType !== "touch") return;
    if (typeof event.currentTarget?.setPointerCapture === "function") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore unsupported pointer capture edge cases.
      }
    }
    pendingPressRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    readyDragIdRef.current = null;
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      readyDragIdRef.current = id;
    }, 150);
  }, [clearHoldTimer, isEnabled]);

  const onHandlePointerMove = useCallback((event) => {
    if (!isEnabled) return;
    armDragByMovement(event);
  }, [armDragByMovement, isEnabled]);

  const onHandlePointerUp = useCallback((event) => {
    if (!pendingPressRef.current) return;
    if (pendingPressRef.current.pointerId !== event.pointerId) return;
    if (typeof event.currentTarget?.releasePointerCapture === "function") {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if pointer capture was not active.
      }
    }
    resetHandleDrag();
  }, [resetHandleDrag]);

  const isDragAllowed = useCallback(
    (id) => isEnabled && readyDragIdRef.current === id,
    [isEnabled]
  );

  useEffect(
    () => () => {
      clearHoldTimer();
    },
    [clearHoldTimer]
  );

  return {
    onHandlePointerDown,
    onHandlePointerMove,
    onHandlePointerUp,
    isDragAllowed,
    resetHandleDrag,
  };
}

function ReorderModeToggle({ isReorderMode, setIsReorderMode }) {
  return (
    <button
      type="button"
      className={`reorder-mode-toggle ${isReorderMode ? "active" : ""}`}
      onClick={() => setIsReorderMode((prev) => !prev)}
    >
      {isReorderMode ? "Done Reordering" : "Reorder Mode"}
    </button>
  );
}

function ClassesPage({
  formError,
  classForm,
  setClassForm,
  handleCreateClass,
  handleDeleteClass,
  handleSwapSortOrder,
  classes,
  students,
  subjects,
  loading,
}) {
  const [showAddClass, setShowAddClass] = useState(false);
  const [dragClassId, setDragClassId] = useState(null);
  const navigate = useNavigate();
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onClassHandlePointerDown,
    onHandlePointerMove: onClassHandlePointerMove,
    onHandlePointerUp: onClassHandlePointerUp,
    isDragAllowed: isClassDragAllowed,
    resetHandleDrag: resetClassHandleDrag,
  } = useHandleDrag(isReorderEnabled);

  const classHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;
  const classCount = classes.length;
  const classSummaryLabel = loading
    ? "Loading your classes..."
    : `${classCount} class${classCount === 1 ? "" : "es"} • ${students.length} students • ${subjects.length} subjects`;

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel classes-page">
        <div className="classes-header">
          <div className="classes-header-copy">
            <h2>Classes</h2>
            <p>{classSummaryLabel}</p>
          </div>
          <div className="classes-header-actions">
            {isMobileLayout && classes.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button type="button" className="classes-add-btn" onClick={() => setShowAddClass(true)}>
              + Add Class
            </button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading classes...</p>
        ) : (
          <div className="class-card-grid">
            {classes.map((item) => {
              const studentCount = students.filter((s) => s.class_id === item.id).length;
              const subjectCount = subjects.filter((s) => s.class_id === item.id).length;
              return (
                <div
                  key={item.id}
                  className="class-card draggable"
                  role="button"
                  tabIndex={0}
                  draggable={isReorderEnabled}
                  onClick={() => navigate(`/classes/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/classes/${item.id}`);
                    }
                  }}
                  onDragStart={(event) => {
                    if (!isClassDragAllowed(item.id)) {
                      event.preventDefault();
                      return;
                    }
                    setDragClassId(item.id);
                  }}
                  onDragEnd={() => {
                    setDragClassId(null);
                    resetClassHandleDrag();
                  }}
                  onDragOver={(event) => {
                    if (!isReorderEnabled) return;
                    event.preventDefault();
                  }}
                  onDrop={() => handleSwapSortOrder("classes", classes, dragClassId, item.id)}
                >
                  <div className="class-card-head">
                    <div className="class-card-main">
                      <div className="class-card-title">{item.name}</div>
                      <div className="class-card-subtitle">
                        {item.grade_level || "—"}
                        {item.school_year ? ` • ${item.school_year}` : ""}
                      </div>
                    </div>
                    <div className="class-card-actions">
                      <button
                        type="button"
                        className={classHandleClassName}
                        aria-label={`Drag ${item.name}`}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => onClassHandlePointerDown(item.id, event)}
                        onPointerMove={onClassHandlePointerMove}
                        onPointerUp={onClassHandlePointerUp}
                        onPointerCancel={onClassHandlePointerUp}
                      >
                        ⠿
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteClass(item.id);
                        }}
                        aria-label={`Delete ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="class-card-meta">
                    <div className="class-card-stat">
                      <strong>{studentCount}</strong>
                      <span>students</span>
                    </div>
                    <div className="class-card-stat">
                      <strong>{subjectCount}</strong>
                      <span>subjects</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && <div className="muted">No classes yet.</div>}
          </div>
        )}
      </section>

      {showAddClass && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Add Class</h3>
            <label className="stack">
              <span>Class name</span>
              <input
                value={classForm.name}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Grade 3 - Ms. Rivera"
                required
              />
            </label>
            <label className="stack">
              <span>Grade level</span>
              <input
                value={classForm.gradeLevel}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, gradeLevel: event.target.value }))
                }
                placeholder="3rd"
              />
            </label>
            <label className="stack">
              <span>School year</span>
              <input
                value={classForm.schoolYear}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, schoolYear: event.target.value }))
                }
                placeholder="2025-2026"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddClass(false)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleCreateClass({ preventDefault: () => {} });
                  setShowAddClass(false);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SubjectDetailPage({
  formError,
  subjects,
  units,
  assessments,
  assessmentEntries,
  unitForm,
  setUnitForm,
  handleCreateUnit,
  handleSwapSortOrder,
  handleDeleteUnit,
}) {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const subject = subjects.find((item) => item.id === subjectId);
  const subjectUnits = units
    .filter((unit) => unit.subject_id === subjectId)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.created_at || "").localeCompare(b.created_at || "")
    );
  const subjectAssessments = assessments.filter((assessment) => assessment.subject_id === subjectId);
  const subjectAssessmentIds = new Set(subjectAssessments.map((assessment) => assessment.id));
  const subjectAssessmentLookup = new Map(subjectAssessments.map((assessment) => [assessment.id, assessment]));
  const subjectResults = assessmentEntries.filter(
    (entry) =>
      subjectAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const subjectAverage = averageFromPercents(
    subjectResults.map((entry) => entryToPercent(entry, subjectAssessmentLookup))
  );
  const averageColor = performanceColor(subjectAverage);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [showDeleteUnitAlert, setShowDeleteUnitAlert] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [dragUnitId, setDragUnitId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onUnitHandlePointerDown,
    onHandlePointerMove: onUnitHandlePointerMove,
    onHandlePointerUp: onUnitHandlePointerUp,
    isDragAllowed: isUnitDragAllowed,
    resetHandleDrag: resetUnitHandleDrag,
  } = useHandleDrag(isReorderEnabled);
  const draggedUnitId = dragUnitId;
  const unitHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;

  if (!subject) {
    return (
      <section className="panel">
        <h2>Subject not found</h2>
        <p className="muted">Select a subject from a class.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel subject-detail-header">
        <h2>{subject.name}</h2>
        <p className="muted">{subject.description || "No description"}</p>
      </section>

      <section className="subject-stat-row">
        <article className="panel subject-stat-card">
          <p className="muted">Subject Average</p>
          <p style={{ color: averageColor }}>{subjectAverage.toFixed(1)}%</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">Total Units</p>
          <p style={{ color: "#2563eb" }}>{subjectUnits.length}</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">Total Assessments</p>
          <p style={{ color: "#7c3aed" }}>{subjectAssessments.length}</p>
        </article>
      </section>

      <section className="panel">
        <div className="subject-units-title">
          <h3>Units</h3>
          <div className="subject-units-actions">
            {isMobileLayout && subjectUnits.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button
              type="button"
              onClick={() => {
                setUnitForm((prev) => ({ ...prev, name: "", description: "" }));
                setShowAddUnitDialog(true);
              }}
            >
              + Add Unit
            </button>
          </div>
        </div>
        <div className="unit-reorder-tip">Drag ⠿ to reorder units. On mobile, use Reorder Mode.</div>
        {subjectUnits.length === 0 ? (
          <div className="subject-empty">
            <h4>No units yet</h4>
            <p className="muted">Create your first unit to start adding assessments.</p>
            <button
              type="button"
              onClick={() => {
                setUnitForm((prev) => ({ ...prev, name: "", description: "" }));
                setShowAddUnitDialog(true);
              }}
            >
              Create First Unit
            </button>
          </div>
        ) : (
          <div className="subject-units-grid">
            {subjectUnits.map((unit) => (
              <article
                key={unit.id}
                className="subject-unit-card draggable"
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled}
                onClick={() => navigate(`/units/${unit.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/units/${unit.id}`);
                  }
                }}
                onDragStart={(event) => {
                  if (!isUnitDragAllowed(unit.id)) {
                    event.preventDefault();
                    return;
                  }
                  setDragUnitId(unit.id);
                }}
                onDragEnd={() => {
                  setDragUnitId(null);
                  resetUnitHandleDrag();
                }}
                onDragOver={(event) => {
                  if (!isReorderEnabled) return;
                  event.preventDefault();
                }}
                onDrop={() => handleSwapSortOrder("units", subjectUnits, draggedUnitId, unit.id)}
              >
                <div className="subject-unit-main">
                  <p className="subject-unit-kicker">Unit</p>
                  <div className="subject-unit-name">{unit.name}</div>
                  <p className="muted">{unit.description || "No description"}</p>
                </div>
                <div className="subject-unit-actions">
                  <button
                    type="button"
                    className={unitHandleClassName}
                    aria-label={`Drag ${unit.name}`}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => onUnitHandlePointerDown(unit.id, event)}
                    onPointerMove={onUnitHandlePointerMove}
                    onPointerUp={onUnitHandlePointerUp}
                    onPointerCancel={onUnitHandlePointerUp}
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete unit"
                    onClick={(event) => {
                      event.stopPropagation();
                      setUnitToDelete(unit);
                      setShowDeleteUnitAlert(true);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddUnitDialog && (
        <div className="modal-overlay">
          <div className="modal-card unit-add-modal">
            <div className="unit-add-header">
              <p className="unit-add-kicker">Units</p>
              <h3>Add New Unit</h3>
              <p className="muted">Create a clear unit name so teachers can find it quickly.</p>
            </div>
            <form
              className="unit-add-form"
              onSubmit={async (event) => {
                await handleCreateUnit(event, subjectId);
                setShowAddUnitDialog(false);
              }}
            >
              <label className="stack">
                <span>Unit name</span>
                <input
                  value={unitForm.name}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Unit 1, Fractions, Ancient Rome"
                  required
                />
              </label>
              <label className="stack">
                <span>Description</span>
                <input
                  value={unitForm.description}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional notes"
                />
              </label>
              {!!unitForm.name.trim() && (
                <div className="subject-unit-preview">
                  <strong>Preview</strong>
                  <p>{unitForm.name}</p>
                </div>
              )}
              <div className="modal-actions unit-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddUnitDialog(false)}>
                  Cancel
                </button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteUnitAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete Unit?</h3>
            <p className="muted">
              {unitToDelete
                ? `Are you sure you want to delete "${unitToDelete.name}"? All assessments and grades inside this unit will be lost.`
                : ""}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setShowDeleteUnitAlert(false);
                  setUnitToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (unitToDelete?.id) {
                    await handleDeleteUnit(unitToDelete.id);
                  }
                  setShowDeleteUnitAlert(false);
                  setUnitToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UnitDetailPage({
  formError,
  units,
  subjects,
  assessments,
  assessmentEntries,
  handleCreateAssessmentForUnit,
  handleSwapSortOrder,
  handleDeleteAssessment,
  handleCopyAssessmentsFromUnit,
}) {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const unit = units.find((item) => item.id === unitId);
  const subject = subjects.find((item) => item.id === unit?.subject_id);
  const unitAssessments = assessments
    .filter((item) => item.unit_id === unitId)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.assessment_date || "").localeCompare(b.assessment_date || "")
    );
  const unitAssessmentIds = new Set(unitAssessments.map((item) => item.id));
  const unitAssessmentLookup = new Map(unitAssessments.map((assessment) => [assessment.id, assessment]));
  const gradedEntries = assessmentEntries.filter(
    (entry) =>
      unitAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const unitAverage = averageFromPercents(
    gradedEntries.map((entry) => entryToPercent(entry, unitAssessmentLookup))
  );
  const averageColor = performanceColor(unitAverage);
  const [showAddAssessmentDialog, setShowAddAssessmentDialog] = useState(false);
  const [showDeleteAssessmentAlert, setShowDeleteAssessmentAlert] = useState(false);
  const [showCopyCriteriaFlow, setShowCopyCriteriaFlow] = useState(false);
  const [copyStep, setCopyStep] = useState("subject");
  const [copySourceSubjectId, setCopySourceSubjectId] = useState("");
  const [copySourceUnitId, setCopySourceUnitId] = useState("");
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    assessmentDate: "",
    maxScore: "",
  });
  const [dragAssessmentId, setDragAssessmentId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onAssessmentHandlePointerDown,
    onHandlePointerMove: onAssessmentHandlePointerMove,
    onHandlePointerUp: onAssessmentHandlePointerUp,
    isDragAllowed: isAssessmentDragAllowed,
    resetHandleDrag: resetAssessmentHandleDrag,
  } = useHandleDrag(isReorderEnabled);
  const draggedAssessmentId = dragAssessmentId;
  const assessmentHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;
  const subjectsInClass = subject?.class_id
    ? subjects
        .filter((item) => item.class_id === subject.class_id)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    : [];
  const sourceUnits = copySourceSubjectId
    ? units
        .filter((item) => item.subject_id === copySourceSubjectId && item.id !== unitId)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    : [];
  const sourceAssessments = copySourceUnitId
    ? assessments
        .filter((item) => item.unit_id === copySourceUnitId)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    : [];

  if (!unit) {
    return (
      <section className="panel">
        <h2>Unit not found</h2>
        <p className="muted">Select a unit from a subject.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel unit-detail-header unit-hero">
        <p className="unit-hero-kicker">Unit Workspace</p>
        <h2>{unit.name}</h2>
        <p className="muted">
          {subject ? `Subject: ${subject.name}` : ""} {unit.description ? `• ${unit.description}` : "• No notes yet"}
        </p>
      </section>

      <section className="unit-stat-row">
        <article className="panel unit-stat-card">
          <p className="muted">Unit Average</p>
          <p style={{ color: averageColor }}>{unitAverage.toFixed(1)}%</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Assessments</p>
          <p style={{ color: "#8a5c34" }}>{unitAssessments.length}</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Total Grades</p>
          <p style={{ color: "#9b6a3f" }}>{gradedEntries.length}</p>
        </article>
      </section>

      <section className="panel unit-actions-panel">
        <h3>Quick Actions</h3>
        <div className="unit-actions-grid">
          <NavLink to="/assessments" className="unit-action-card action-green">
            <strong>Gradebook</strong>
            <span>View all grades</span>
          </NavLink>
          <button
            type="button"
            className="unit-action-card action-amber"
            onClick={() => {
              setCopySourceSubjectId("");
              setCopySourceUnitId("");
              setCopyStep("subject");
              setShowCopyCriteriaFlow(true);
            }}
          >
            <strong>Copy Criteria</strong>
            <span>Import assessments from another unit</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="unit-assessment-title">
          <h3>Assessments</h3>
          <div className="unit-assessment-actions-row">
            {isMobileLayout && unitAssessments.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button
              type="button"
              onClick={() => {
                setNewAssessment({ title: "", assessmentDate: "", maxScore: "" });
                setShowAddAssessmentDialog(true);
              }}
            >
              + Add Assessment
            </button>
          </div>
        </div>
        <div className="unit-reorder-tip">Drag ⠿ to reorder assessments. On mobile, use Reorder Mode.</div>
        {unitAssessments.length === 0 ? (
          <div className="unit-empty">
            <h4>No assessments yet</h4>
            <p className="muted">Create your first assessment or copy criteria from another unit.</p>
            <button
              type="button"
              onClick={() => {
                setNewAssessment({ title: "", assessmentDate: "", maxScore: "" });
                setShowAddAssessmentDialog(true);
              }}
            >
              Create First Assessment
            </button>
          </div>
        ) : (
          <div className="unit-assessment-grid">
            {unitAssessments.map((item) => (
              <article
                key={item.id}
                className="unit-assessment-card draggable"
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled}
                onClick={() => navigate(`/assessments/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/assessments/${item.id}`);
                  }
                }}
                onDragStart={(event) => {
                  if (!isAssessmentDragAllowed(item.id)) {
                    event.preventDefault();
                    return;
                  }
                  setDragAssessmentId(item.id);
                }}
                onDragEnd={() => {
                  setDragAssessmentId(null);
                  resetAssessmentHandleDrag();
                }}
                onDragOver={(event) => {
                  if (!isReorderEnabled) return;
                  event.preventDefault();
                }}
                onDrop={() =>
                  handleSwapSortOrder("assessments", unitAssessments, draggedAssessmentId, item.id)
                }
              >
                <div className="unit-assessment-main">
                  <p className="unit-assessment-kicker">Assessment</p>
                  <div className="unit-assessment-name">{item.title}</div>
                  <p className="muted">
                    {item.assessment_date || "No date"} {item.max_score ? `• ${item.max_score} pts` : ""}
                  </p>
                </div>
                <div className="unit-assessment-actions">
                  <button
                    type="button"
                    className={assessmentHandleClassName}
                    aria-label={`Drag ${item.title}`}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => onAssessmentHandlePointerDown(item.id, event)}
                    onPointerMove={onAssessmentHandlePointerMove}
                    onPointerUp={onAssessmentHandlePointerUp}
                    onPointerCancel={onAssessmentHandlePointerUp}
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete assessment"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssessmentToDelete(item);
                      setShowDeleteAssessmentAlert(true);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddAssessmentDialog && (
        <div className="modal-overlay">
          <div className="modal-card assessment-add-modal">
            <div className="assessment-add-header">
              <p className="assessment-add-kicker">Assessments</p>
              <h3>Add New Assessment</h3>
              <p className="muted">Create a clear assessment so grading stays simple and organized.</p>
            </div>
            <form
              className="assessment-add-form"
              onSubmit={async (event) => {
                const ok = await handleCreateAssessmentForUnit(
                  event,
                  unitId,
                  subject?.id,
                  subject?.class_id,
                  newAssessment
                );
                if (ok) setShowAddAssessmentDialog(false);
              }}
            >
              <label className="stack">
                <span>Assessment Name</span>
                <input
                  name="title"
                  value={newAssessment.title}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Quiz 1, Chapter Test, Midterm Exam"
                  required
                />
              </label>
              <label className="stack">
                <span>Date</span>
                <input
                  name="assessmentDate"
                  type="date"
                  value={newAssessment.assessmentDate}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, assessmentDate: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>Max Score</span>
                <input
                  name="maxScore"
                  type="number"
                  min="0"
                  value={newAssessment.maxScore}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, maxScore: event.target.value }))
                  }
                />
              </label>
              {!!newAssessment.title.trim() && (
                <div className="subject-unit-preview">
                  <strong>Preview</strong>
                  <p>{newAssessment.title}</p>
                </div>
              )}
              <div className="modal-actions assessment-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddAssessmentDialog(false)}>
                  Cancel
                </button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {showDeleteAssessmentAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete Assessment?</h3>
            <p className="muted">
              {assessmentToDelete
                ? `Are you sure you want to delete "${assessmentToDelete.title}"?`
                : ""}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setShowDeleteAssessmentAlert(false);
                  setAssessmentToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (assessmentToDelete?.id) {
                    await handleDeleteAssessment(assessmentToDelete.id);
                  }
                  setShowDeleteAssessmentAlert(false);
                  setAssessmentToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        )}

        {showCopyCriteriaFlow && (
          <div className="modal-overlay">
            <div className="modal-card copy-criteria-modal">
              {copyStep === "subject" && (
                <>
                  <h3>Copy Criteria: Choose Subject</h3>
                  <label className="stack">
                    <span>Subject</span>
                    <select
                      value={copySourceSubjectId}
                      onChange={(event) => {
                        setCopySourceSubjectId(event.target.value);
                        setCopySourceUnitId("");
                      }}
                    >
                      <option value="">Select subject</option>
                      {subjectsInClass.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setShowCopyCriteriaFlow(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceSubjectId}
                      onClick={() => setCopyStep("unit")}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {copyStep === "unit" && (
                <>
                  <h3>Copy Criteria: Choose Unit</h3>
                  <label className="stack">
                    <span>Unit</span>
                    <select
                      value={copySourceUnitId}
                      onChange={(event) => setCopySourceUnitId(event.target.value)}
                    >
                      <option value="">Select unit</option>
                      {sourceUnits.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("subject")}>
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceUnitId}
                      onClick={() => setCopyStep("confirm")}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {copyStep === "confirm" && (
                <>
                  <h3>Confirm Copy</h3>
                  <p className="muted">
                    Copy {sourceAssessments.length} assessment
                    {sourceAssessments.length === 1 ? "" : "s"} into this unit?
                  </p>
                  {sourceAssessments.length > 0 && (
                    <ul className="list">
                      {sourceAssessments.slice(0, 8).map((item) => (
                        <li key={item.id}>{item.title}</li>
                      ))}
                      {sourceAssessments.length > 8 && (
                        <li className="muted">+{sourceAssessments.length - 8} more</li>
                      )}
                    </ul>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("unit")}>
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceUnitId}
                      onClick={async () => {
                        await handleCopyAssessmentsFromUnit(
                          copySourceUnitId,
                          unitId,
                          subject?.id,
                          subject?.class_id
                        );
                        setShowCopyCriteriaFlow(false);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </>
  );
}

function StudentDetailPage({
  students,
  classes,
  subjects,
  assessments,
  attendanceEntries,
  runningRecords,
  assessmentEntries,
  rubricCriteria,
  rubricCategories,
  rubrics,
  developmentScores,
  developmentScoreForm,
  setDevelopmentScoreForm,
  handleCreateDevelopmentScore,
  handleCreateDevelopmentScoreEntry,
  handleUpdateDevelopmentScore,
  handleUpdateStudent,
  formError,
}) {
  const { studentId } = useParams();
  const student = students.find((item) => item.id === studentId);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showDevelopmentForm, setShowDevelopmentForm] = useState(false);
  const [activeDevelopmentCriterionId, setActiveDevelopmentCriterionId] = useState("");
  const [editingDevelopmentScoreId, setEditingDevelopmentScoreId] = useState("");
  const [showAddDevelopmentHistoryForm, setShowAddDevelopmentHistoryForm] = useState(false);
  const [developmentHistoryEditForm, setDevelopmentHistoryEditForm] = useState({
    rating: "3",
    date: "",
    notes: "",
  });
  const [newDevelopmentHistoryForm, setNewDevelopmentHistoryForm] = useState({
    rating: "3",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    gender: "Prefer not to say",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
  });
  const records = runningRecords
    .filter((record) => record.student_id === studentId)
    .sort((a, b) => (b.record_date || "").localeCompare(a.record_date || ""));
  const assessmentsForStudent = assessmentEntries.filter(
    (entry) => entry.student_id === studentId
  );
  const scoredAssessments = assessmentsForStudent.filter(
    (entry) => entry.score !== null && Number.isFinite(Number(entry.score))
  );
  const studentScores = developmentScores
    .filter((score) => score.student_id === studentId)
    .sort((a, b) => (b.score_date || b.created_at || "").localeCompare(a.score_date || a.created_at || ""));
  const classItem = classes.find((item) => item.id === student?.class_id);
  const attendanceForStudent = attendanceEntries.filter((entry) => entry.student_id === studentId);
  const attendanceSummary = {
    present: attendanceForStudent.filter((entry) => entry.status === "Present").length,
    absent: attendanceForStudent.filter((entry) => entry.status === "Didn't come").length,
    late: attendanceForStudent.filter((entry) => entry.status === "Arrived late").length,
    leftEarly: attendanceForStudent.filter((entry) => entry.status === "Left early").length,
  };
  const attendanceTotal =
    attendanceSummary.present +
    attendanceSummary.absent +
    attendanceSummary.late +
    attendanceSummary.leftEarly;
  const assessmentLookup = useMemo(() => {
    const map = new Map();
    assessments.forEach((assessment) => map.set(assessment.id, assessment));
    return map;
  }, [assessments]);
  const overallAverage = averageFromPercents(
    scoredAssessments.map((entry) => entryToPercent(entry, assessmentLookup))
  );
  const subjectLookup = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => map.set(subject.id, subject));
    return map;
  }, [subjects]);
  const criteriaLookup = useMemo(() => {
    const map = new Map();
    rubricCriteria.forEach((criterion) => map.set(criterion.id, criterion));
    return map;
  }, [rubricCriteria]);
  const categoryLookup = useMemo(() => {
    const map = new Map();
    rubricCategories.forEach((category) => map.set(category.id, category));
    return map;
  }, [rubricCategories]);
  const rubricLookup = useMemo(() => {
    const map = new Map();
    rubrics.forEach((rubric) => map.set(rubric.id, rubric));
    return map;
  }, [rubrics]);
  const [developmentYearFilter, setDevelopmentYearFilter] = useState("all");

  const normalizedLevel = (value) => {
    const level = (value || "").toLowerCase();
    if (level.startsWith("independent")) return { label: "Independent", color: "#16a34a", short: "Ind." };
    if (level.startsWith("instructional")) return { label: "Instructional", color: "#ea580c", short: "Inst." };
    return { label: "Frustration", color: "#dc2626", short: "Frust." };
  };

  const latestLevel = records.length ? normalizedLevel(records[0].level) : null;
  const avgAccuracy = records.length
    ? records.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) / records.length
    : 0;

  const subjectsForClass = subjects
    .filter((subject) => subject.class_id === student?.class_id)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.created_at || "").localeCompare(b.created_at || "")
    );

  const performanceBySubject = subjectsForClass.map((subject) => {
    const assessmentIds = new Set(
      assessments.filter((assessment) => assessment.subject_id === subject.id).map((assessment) => assessment.id)
    );
    const subjectScores = assessmentsForStudent.filter(
      (entry) =>
        assessmentIds.has(entry.assessment_id) &&
        entry.score !== null &&
        Number.isFinite(Number(entry.score))
    );
    const average = averageFromPercents(
      subjectScores.map((entry) => entryToPercent(entry, assessmentLookup))
    );
    return { subject, count: subjectScores.length, average };
  });

  const recentAssessments = assessmentsForStudent
    .map((entry) => ({ entry, assessment: assessmentLookup.get(entry.assessment_id) }))
    .sort((a, b) => {
      const dateA = a.assessment?.assessment_date || "";
      const dateB = b.assessment?.assessment_date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return Number(b.assessment?.sort_order ?? 0) - Number(a.assessment?.sort_order ?? 0);
    })
    .slice(0, 10);

  const latestScoresByCriterion = [];
  const seenCriteria = new Set();
  for (const score of studentScores) {
    if (!score.criterion_id || seenCriteria.has(score.criterion_id)) continue;
    seenCriteria.add(score.criterion_id);
    latestScoresByCriterion.push(score);
  }
  const groupedDevelopment = latestScoresByCriterion.reduce((acc, score) => {
    const criterion = criteriaLookup.get(score.criterion_id);
    const categoryName = categoryLookup.get(criterion?.category_id)?.name || "Other";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(score);
    return acc;
  }, {});

  const ratingLabel = (rating) => {
    if (rating === 1) return "Needs Significant Support";
    if (rating === 2) return "Beginning to Develop";
    if (rating === 3) return "Developing";
    if (rating === 4) return "Proficient";
    if (rating === 5) return "Mastering / Exceeding";
    return "Not Rated";
  };

  const averageColor = (value) => {
    return performanceColor(value);
  };
  const activeDevelopmentHistory = activeDevelopmentCriterionId
    ? studentScores.filter((score) => score.criterion_id === activeDevelopmentCriterionId)
    : [];
  const activeDevelopmentHistoryChronological = [...activeDevelopmentHistory].reverse();
  const activeDevelopmentCriterion = activeDevelopmentCriterionId
    ? criteriaLookup.get(activeDevelopmentCriterionId)
    : null;
  const activeDevelopmentCategoryName = activeDevelopmentCriterion
    ? categoryLookup.get(activeDevelopmentCriterion.category_id)?.name || "Other"
    : "";

  const trendLabel = (current, previous) => {
    if (!previous) return "Baseline";
    const currentRating = Number(current?.rating || 0);
    const previousRating = Number(previous?.rating || 0);
    if (currentRating > previousRating) return "Improved";
    if (currentRating < previousRating) return "Needs Support";
    return "Steady";
  };

  const startEditingDevelopmentHistory = (score) => {
    setEditingDevelopmentScoreId(score.id);
    setDevelopmentHistoryEditForm({
      rating: String(Number(score.rating || 3)),
      date: score.score_date || "",
      notes: score.notes || "",
    });
  };
  const sparklineData = useMemo(() => {
    const ratings = activeDevelopmentHistoryChronological
      .map((item) => Number(item.rating))
      .filter((value) => Number.isFinite(value));
    if (!ratings.length) return null;
    const width = 320;
    const height = ratings.length <= 2 ? 56 : 88;
    const padX = 12;
    const padY = 12;
    const usableWidth = width - padX * 2;
    const usableHeight = height - padY * 2;
    const xForIndex = (index) =>
      ratings.length === 1 ? width / 2 : padX + (usableWidth * index) / (ratings.length - 1);
    const yForRating = (rating) => padY + ((5 - rating) / 4) * usableHeight;
    const points = ratings.map((rating, index) => `${xForIndex(index)},${yForRating(rating)}`).join(" ");
    return {
      width,
      height,
      points,
      dots: ratings.map((rating, index) => ({
        x: xForIndex(index),
        y: yForRating(rating),
        rating,
      })),
      first: ratings[0],
      last: ratings[ratings.length - 1],
      total: ratings.length,
    };
  }, [activeDevelopmentHistoryChronological]);

  useEffect(() => {
    setEditingDevelopmentScoreId("");
    setShowAddDevelopmentHistoryForm(false);
    setNewDevelopmentHistoryForm({
      rating: "3",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  }, [activeDevelopmentCriterionId]);

  const rubricYearOptions = useMemo(() => {
    const values = new Set();
    rubrics.forEach((rubric) => {
      const gradeBand = (rubric.grade_band || "").trim();
      if (gradeBand) values.add(gradeBand);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rubrics]);

  const rubricCriteriaWithMeta = useMemo(() => {
    return rubricCriteria.map((criterion) => {
      const category = categoryLookup.get(criterion.category_id);
      const rubric = rubricLookup.get(category?.rubric_id);
      return {
        ...criterion,
        categoryName: category?.name || "Other",
        gradeBand: (rubric?.grade_band || "General").trim() || "General",
      };
    });
  }, [rubricCriteria, categoryLookup, rubricLookup]);

  const filteredCriteriaForForm = useMemo(() => {
    const byYear =
      developmentYearFilter === "all"
        ? rubricCriteriaWithMeta
        : rubricCriteriaWithMeta.filter((criterion) => criterion.gradeBand === developmentYearFilter);
    return byYear.sort((a, b) => {
      const groupA = `${a.gradeBand} ${a.categoryName}`;
      const groupB = `${b.gradeBand} ${b.categoryName}`;
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return (a.label || a.description || "").localeCompare(b.label || b.description || "");
    });
  }, [rubricCriteriaWithMeta, developmentYearFilter]);

  const selectedCriterionMeta = useMemo(
    () => rubricCriteriaWithMeta.find((criterion) => criterion.id === developmentScoreForm.criterionId) || null,
    [rubricCriteriaWithMeta, developmentScoreForm.criterionId]
  );

  const filteredCriteriaIds = useMemo(
    () => new Set(filteredCriteriaForForm.map((criterion) => criterion.id)),
    [filteredCriteriaForForm]
  );

  useEffect(() => {
    if (!developmentScoreForm.criterionId) return;
    if (filteredCriteriaIds.has(developmentScoreForm.criterionId)) return;
    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: "" }));
  }, [developmentScoreForm.criterionId, filteredCriteriaIds, setDevelopmentScoreForm]);

  const groupedCriterionOptions = useMemo(() => {
    const groupMap = new Map();
    filteredCriteriaForForm.forEach((criterion) => {
      const groupLabel = `${criterion.gradeBand} • ${criterion.categoryName}`;
      if (!groupMap.has(groupLabel)) groupMap.set(groupLabel, []);
      groupMap.get(groupLabel).push(criterion);
    });
    return Array.from(groupMap.entries());
  }, [filteredCriteriaForForm]);

  const toggleStatus = async (field) => {
    if (!student) return;
    const next = {
      gender: student.gender || "Prefer not to say",
      notes: student.notes || "",
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
      [field]:
        field === "isParticipatingWell"
          ? !student.is_participating_well
          : field === "needsHelp"
            ? !student.needs_help
            : !student.missing_homework,
    };
    await handleUpdateStudent(studentId, next);
  };

  if (!student) {
    return (
      <section className="panel">
        <h2>Student not found</h2>
        <p className="muted">Select a student from a class.</p>
      </section>
    );
  }

  const studentInitials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`
    .toUpperCase()
    .trim() || "S";
  const classLabel = classItem
    ? `${classItem.name}${classItem.grade_level ? ` (${classItem.grade_level})` : ""}`
    : "No class";

  const StudentStatusIcon = ({ kind }) => {
    switch (kind) {
      case "participating":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="7.5" r="2.7" />
            <path d="M6.2 18c0-2.5 2.1-4.5 4.6-4.5h2.4c2.6 0 4.6 2 4.6 4.5" />
            <path d="M6 11.8l2.4 2.3 3.2-3.3" />
          </svg>
        );
      case "needsHelp":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4.7 20 19H4L12 4.7Z" />
            <line x1="12" y1="9.2" x2="12" y2="13.1" />
            <circle cx="12" cy="16" r="0.9" />
          </svg>
        );
      case "homework":
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4.5h8.4l3.6 3.6v11.4H6z" />
            <path d="M14.4 4.5v3.6H18" />
            <line x1="8.8" y1="12" x2="15.2" y2="12" />
            <line x1="8.8" y1="15" x2="13.4" y2="15" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel student-profile-header">
        <div className="student-profile-hero">
          <div className="student-profile-avatar">{studentInitials}</div>
          <div className="student-profile-copy">
            <h2>
              {student.first_name} {student.last_name}
            </h2>
            <p className="muted">{classLabel}</p>
            <div className="student-profile-chips">
              <span className="student-chip">{student.gender || "Prefer not to say"}</span>
              <span className={`student-chip ${student.notes ? "" : "subtle"}`}>
                {student.notes ? "Notes saved" : "No notes"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setEditForm({
              gender: student.gender || "Prefer not to say",
              notes: student.notes || "",
              isParticipatingWell: !!student.is_participating_well,
              needsHelp: !!student.needs_help,
              missingHomework: !!student.missing_homework,
            });
            setShowEditInfo(true);
          }}
        >
          Edit Info
        </button>
      </section>

      <section className="panel student-status-panel">
        <h3>Quick Status</h3>
        <div className="student-status-grid">
          <button
            type="button"
            className={`student-status-card status-participating ${student.is_participating_well ? "active green" : ""}`}
            onClick={() => toggleStatus("isParticipatingWell")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="participating" />
            </span>
            <div>
              <strong>Participating Well</strong>
              <p>{student.is_participating_well ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-needs-help ${student.needs_help ? "active orange" : ""}`}
            onClick={() => toggleStatus("needsHelp")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="needsHelp" />
            </span>
            <div>
              <strong>Needs Help</strong>
              <p>{student.needs_help ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-missing-homework ${student.missing_homework ? "active red" : ""}`}
            onClick={() => toggleStatus("missingHomework")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="homework" />
            </span>
            <div>
              <strong>Missing Homework</strong>
              <p>{student.missing_homework ? "Active" : "Inactive"}</p>
            </div>
          </button>
        </div>
      </section>

      <section className="student-stat-row">
        <article className="panel student-stat-card">
          <p className="muted">Overall Average</p>
          <p style={{ color: averageColor(overallAverage) }}>{overallAverage.toFixed(1)}%</p>
        </article>
        <article className="panel student-stat-card">
          <p className="muted">Total Assessments</p>
          <p style={{ color: "#8a5c34" }}>{assessmentsForStudent.length}</p>
        </article>
      </section>

      <section className="panel">
        <h3>Attendance Summary</h3>
        {attendanceTotal === 0 ? (
          <p className="muted">No attendance records yet.</p>
        ) : (
          <div className="attendance-summary-grid">
            <article>
              <strong>{attendanceSummary.present}</strong>
              <span>Present</span>
              <small>{Math.round((attendanceSummary.present / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.absent}</strong>
              <span>Absent</span>
              <small>{Math.round((attendanceSummary.absent / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.late}</strong>
              <span>Late</span>
              <small>{Math.round((attendanceSummary.late / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.leftEarly}</strong>
              <span>Left Early</span>
              <small>{Math.round((attendanceSummary.leftEarly / attendanceTotal) * 100)}%</small>
            </article>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="student-section-title">
          <h3>Running Records</h3>
          <NavLink to="/running-records" className="student-view-all-btn">
            View all
          </NavLink>
        </div>
        {records.length === 0 ? (
          <p className="muted">No running records yet.</p>
        ) : (
          <>
            <div className="student-running-stats">
              <article>
                <strong>{records.length}</strong>
                <span>Total</span>
              </article>
              <article>
                <strong>{avgAccuracy.toFixed(1)}%</strong>
                <span>Avg. Accuracy</span>
              </article>
              <article>
                <strong style={{ color: latestLevel?.color }}>{latestLevel?.short || "-"}</strong>
                <span>Latest</span>
              </article>
            </div>
            <ul className="list student-mini-list">
              {records.slice(0, 3).map((record) => {
                const level = normalizedLevel(record.level);
                return (
                  <li key={record.id}>
                    <span>{record.record_date || "No date"} · {record.text_title || "Untitled text"}</span>
                    <strong style={{ color: level.color }}>{record.accuracy_pct ?? 0}%</strong>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h3>Performance by Subject</h3>
        {performanceBySubject.length === 0 ? (
          <p className="muted">No subjects in this class yet.</p>
        ) : (
          <div className="student-subject-grid">
            {performanceBySubject.map((item) => (
              <article key={item.subject.id}>
                <div>
                  <strong>{item.subject.name}</strong>
                  <p className="muted">{item.count} assessments</p>
                </div>
                <p style={{ color: averageColor(item.average) }}>{item.average.toFixed(1)}%</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Recent Assessments</h3>
        {recentAssessments.length === 0 ? (
          <p className="muted">No assessments yet.</p>
        ) : (
          <ul className="list student-mini-list">
            {recentAssessments.map(({ entry, assessment }) => {
              const subjectName = subjectLookup.get(assessment?.subject_id)?.name;
              const percent = entryToPercent(entry, assessmentLookup);
              return (
                <li key={entry.id}>
                  <span>
                    {assessment?.title || "Assessment"}
                    {subjectName ? ` · ${subjectName}` : ""}
                    {assessment?.assessment_date ? ` · ${assessment.assessment_date}` : ""}
                  </span>
                  {entry.score !== null && Number.isFinite(Number(entry.score)) && percent !== null ? (
                    <strong style={{ color: averageColor(percent) }}>{percent.toFixed(1)}%</strong>
                  ) : (
                    <strong className="muted">Not graded</strong>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="student-section-title">
          <h3>Development Tracking</h3>
          <button type="button" onClick={() => setShowDevelopmentForm(true)}>
            Update
          </button>
        </div>
        {Object.keys(groupedDevelopment).length === 0 ? (
          <p className="muted">No development tracking yet.</p>
        ) : (
          <div className="student-development-groups">
            {Object.entries(groupedDevelopment)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([categoryName, scores]) => (
                <article key={categoryName} className="student-development-category">
                  <h4>{categoryName}</h4>
                  <ul className="list student-dev-list">
                    {scores.map((score) => {
                      const criterion = criteriaLookup.get(score.criterion_id);
                      const scoreValue = Math.max(0, Number(score.rating || 0));
                      return (
                        <li key={score.id}>
                          <button
                            type="button"
                            className="student-dev-row-btn"
                            onClick={() => {
                              setActiveDevelopmentCriterionId(score.criterion_id || "");
                              setEditingDevelopmentScoreId("");
                            }}
                          >
                            <span className="student-dev-criterion">
                              <span className="student-dev-criterion-title">
                                {criterion?.label || "Criterion"}
                              </span>
                              {score.notes ? (
                                <span className="student-dev-criterion-note">{score.notes}</span>
                              ) : (
                                <span className="student-dev-criterion-note subtle">No notes added</span>
                              )}
                            </span>
                            <span className="student-dev-rating">
                              <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                                {"★".repeat(scoreValue)}
                                {"☆".repeat(Math.max(0, 5 - scoreValue))}
                              </span>
                              <span className="student-dev-label">{ratingLabel(scoreValue)}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        )}
      </section>

      {activeDevelopmentCriterion && (
        <div className="modal-overlay">
          <div className="modal-card development-history-modal">
            <div className="development-history-header">
              <div>
                <h3>{activeDevelopmentCriterion.label || "Criterion History"}</h3>
                <p className="muted">{activeDevelopmentCategoryName}</p>
                {activeDevelopmentCriterion.description ? (
                  <p className="development-history-description">{activeDevelopmentCriterion.description}</p>
                ) : null}
              </div>
              <div className="development-history-header-actions">
                <button
                  type="button"
                  onClick={() => setShowAddDevelopmentHistoryForm((prev) => !prev)}
                >
                  {showAddDevelopmentHistoryForm ? "Cancel new rating" : "+ Add New Rating"}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    setActiveDevelopmentCriterionId("");
                    setEditingDevelopmentScoreId("");
                    setShowAddDevelopmentHistoryForm(false);
                  }}
                  aria-label="Close history"
                >
                  ×
                </button>
              </div>
            </div>

            {activeDevelopmentHistory.length === 0 ? (
              <p className="muted">No history yet for this criterion.</p>
            ) : (
              <>
                {sparklineData && (
                  <section
                    className={`development-sparkline-card ${sparklineData.total <= 2 ? "compact" : ""}`}
                    aria-label="Progress trend"
                  >
                    <div className="development-sparkline-meta">
                      <strong>Trend</strong>
                      <span>{sparklineData.total} entries</span>
                    </div>
                    <svg
                      className="development-sparkline"
                      viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                      role="img"
                      aria-label={`Ratings moved from ${sparklineData.first} to ${sparklineData.last}`}
                    >
                      <polyline
                        className="development-sparkline-line"
                        points={sparklineData.points}
                      />
                      {sparklineData.dots.map((dot, idx) => (
                        <circle key={idx} cx={dot.x} cy={dot.y} r="3.2" className="development-sparkline-dot" />
                      ))}
                    </svg>
                    <div className="development-sparkline-labels">
                      <span>Earlier: {sparklineData.first}/5</span>
                      <span>Latest: {sparklineData.last}/5</span>
                    </div>
                    {sparklineData.total === 1 && (
                      <p className="development-sparkline-hint">Add one more rating to start visual trend tracking.</p>
                    )}
                  </section>
                )}
                {showAddDevelopmentHistoryForm && (
                  <form
                    className="development-history-add"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const success = await handleCreateDevelopmentScoreEntry({
                        studentId,
                        criterionId: activeDevelopmentCriterionId,
                        rating: newDevelopmentHistoryForm.rating,
                        date: newDevelopmentHistoryForm.date,
                        notes: newDevelopmentHistoryForm.notes,
                      });
                      if (!success) return;
                      setShowAddDevelopmentHistoryForm(false);
                      setNewDevelopmentHistoryForm({
                        rating: "3",
                        date: format(new Date(), "yyyy-MM-dd"),
                        notes: "",
                      });
                    }}
                  >
                    <label className="stack">
                      <span>Rating</span>
                      <select
                        value={newDevelopmentHistoryForm.rating}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, rating: event.target.value }))
                        }
                      >
                        <option value="1">1 - Needs Significant Support</option>
                        <option value="2">2 - Beginning to Develop</option>
                        <option value="3">3 - Developing</option>
                        <option value="4">4 - Proficient</option>
                        <option value="5">5 - Mastering / Exceeding</option>
                      </select>
                    </label>
                    <label className="stack">
                      <span>Date</span>
                      <input
                        type="date"
                        value={newDevelopmentHistoryForm.date}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, date: event.target.value }))
                        }
                      />
                    </label>
                    <label className="stack">
                      <span>Notes</span>
                      <textarea
                        rows="2"
                        value={newDevelopmentHistoryForm.notes}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        placeholder="Optional notes"
                      />
                    </label>
                    <div className="modal-actions">
                      <button type="submit">Save new rating</button>
                    </div>
                  </form>
                )}
                <ul className="list development-history-list">
                {activeDevelopmentHistory.map((score, index) => {
                  const nextOlderScore = activeDevelopmentHistory[index + 1];
                  const trend = trendLabel(score, nextOlderScore);
                  const scoreValue = Math.max(0, Number(score.rating || 0));
                  const trendClass =
                    trend === "Improved" ? "improved" : trend === "Needs Support" ? "declined" : "steady";
                  const dateLabel = score.score_date || score.created_at?.slice(0, 10) || "No date";
                  return (
                    <li key={score.id}>
                      <div className="development-history-item-head">
                        <div className="development-history-rating">
                          <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                            {"★".repeat(scoreValue)}
                            {"☆".repeat(Math.max(0, 5 - scoreValue))}
                          </span>
                          <span>{ratingLabel(scoreValue)}</span>
                        </div>
                        <div className={`development-trend ${trendClass}`}>{trend}</div>
                      </div>
                      <p className="development-history-date">{dateLabel}</p>
                      {editingDevelopmentScoreId === score.id ? (
                        <form
                          className="development-history-edit"
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const success = await handleUpdateDevelopmentScore(score.id, {
                              rating: developmentHistoryEditForm.rating,
                              date: developmentHistoryEditForm.date,
                              notes: developmentHistoryEditForm.notes,
                            });
                            if (!success) return;
                            setEditingDevelopmentScoreId("");
                          }}
                        >
                          <label className="stack">
                            <span>Rating</span>
                            <select
                              value={developmentHistoryEditForm.rating}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  rating: event.target.value,
                                }))
                              }
                            >
                              <option value="1">1 - Needs Significant Support</option>
                              <option value="2">2 - Beginning to Develop</option>
                              <option value="3">3 - Developing</option>
                              <option value="4">4 - Proficient</option>
                              <option value="5">5 - Mastering / Exceeding</option>
                            </select>
                          </label>
                          <label className="stack">
                            <span>Date</span>
                            <input
                              type="date"
                              value={developmentHistoryEditForm.date}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  date: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="stack">
                            <span>Notes</span>
                            <textarea
                              rows="2"
                              value={developmentHistoryEditForm.notes}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  notes: event.target.value,
                                }))
                              }
                              placeholder="Optional notes"
                            />
                          </label>
                          <div className="modal-actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setEditingDevelopmentScoreId("")}
                            >
                              Cancel
                            </button>
                            <button type="submit">Save changes</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {score.notes ? (
                            <p className="development-history-note">{score.notes}</p>
                          ) : (
                            <p className="development-history-note muted">No notes for this record.</p>
                          )}
                          <div className="development-history-actions">
                            <button type="button" className="secondary" onClick={() => startEditingDevelopmentHistory(score)}>
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {showDevelopmentForm && (
        <div className="modal-overlay">
          <div className="modal-card development-modal">
            <div className="development-modal-header">
              <h3>Update Development Tracking</h3>
              <p className="muted">Choose the year range first, then pick the criterion with context.</p>
            </div>
            <form
              onSubmit={async (event) => {
                await handleCreateDevelopmentScore(event, studentId);
                setShowDevelopmentForm(false);
              }}
              className="development-modal-form"
            >
              <label className="stack">
                <span>Year Range</span>
                <select
                  value={developmentYearFilter}
                  onChange={(event) => setDevelopmentYearFilter(event.target.value)}
                >
                  <option value="all">All year ranges</option>
                  {rubricYearOptions.map((yearRange) => (
                    <option key={yearRange} value={yearRange}>
                      {yearRange}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Criterion</span>
                <select
                  value={developmentScoreForm.criterionId}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select criterion</option>
                  {groupedCriterionOptions.map(([groupLabel, criteria]) => (
                    <optgroup key={groupLabel} label={groupLabel}>
                      {criteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.label || criterion.description || "Criterion"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="development-criterion-preview">
                {selectedCriterionMeta ? (
                  <>
                    <strong>{selectedCriterionMeta.label || "Selected criterion"}</strong>
                    <p className="muted">
                      {selectedCriterionMeta.description || "No extra description for this criterion yet."}
                    </p>
                    <div className="development-criterion-meta">
                      <span>{selectedCriterionMeta.gradeBand}</span>
                      <span>{selectedCriterionMeta.categoryName}</span>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    Select a criterion to see what it measures before saving.
                  </p>
                )}
              </div>
              <label className="stack">
                <span>Rating (1-5)</span>
                <select
                  value={developmentScoreForm.rating}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                >
                  <option value="1">1 - Needs Significant Support</option>
                  <option value="2">2 - Beginning to Develop</option>
                  <option value="3">3 - Developing</option>
                  <option value="4">4 - Proficient</option>
                  <option value="5">5 - Mastering / Exceeding</option>
                </select>
              </label>
              <label className="stack">
                <span>Date</span>
                <input
                  type="date"
                  value={developmentScoreForm.date}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>Notes</span>
                <input
                  value={developmentScoreForm.notes}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <div className="modal-actions development-modal-actions">
                <button type="button" className="secondary" onClick={() => setShowDevelopmentForm(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditInfo && (
        <div className="modal-overlay">
          <div className="modal-card student-edit-modal">
            <div className="student-edit-header">
              <h3>Edit Student</h3>
              <p className="muted">
                Update student info and reminders for {student.first_name} {student.last_name}.
              </p>
            </div>
            <form
              className="student-edit-form"
              onSubmit={async (event) => {
                event.preventDefault();
                await handleUpdateStudent(studentId, editForm);
                setShowEditInfo(false);
              }}
            >
              <label className="stack">
                <span>Gender</span>
                <select
                  value={editForm.gender}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))}
                >
                  {STUDENT_GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Notes</span>
                <textarea
                  rows="3"
                  value={editForm.notes}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional notes about this student"
                />
              </label>
              <p className="muted student-edit-help">
                To keep students apart during group generation, use{" "}
                <NavLink to={`/groups?classId=${student.class_id || ""}`}>Groups → Separations</NavLink>.
              </p>
              <div className="modal-actions student-edit-actions">
                <button type="button" className="secondary" onClick={() => setShowEditInfo(false)}>
                  Cancel
                </button>
                <button type="submit">Done</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        onSuccess("Check your email to confirm your account, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <div className="auth-head">
        <div className="auth-badge" aria-hidden="true">🎓</div>
        <h1>Teacher Assistant</h1>
        <p className="muted">Sign in to sync your data across devices.</p>
      </div>

      <form onSubmit={handleSubmit} className="stack auth-form">
        <label className="stack">
          <span>Email</span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="stack">
          <span>Password</span>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        className="auth-switch"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}

function formatDisplayName(user) {
  const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const emailLocalPart = String(user?.email || "").split("@")[0] || "";
  const source = (metadataName || emailLocalPart || "Teacher").replace(/[._-]+/g, " ").trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function TileIcon({ kind }) {
  switch (kind) {
    case "classes":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4" y="4" width="16" height="10" rx="2" />
          <circle cx="8" cy="18" r="1.2" />
          <circle cx="12" cy="18" r="1.2" />
          <circle cx="16" cy="18" r="1.2" />
          <line x1="10" y1="10" x2="14" y2="7" />
        </svg>
      );
    case "attendance":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <path d="M8.2 12.4l2.2 2.3 5-5.1" />
          <line x1="8" y1="8" x2="16" y2="8" />
        </svg>
      );
    case "gradebook":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <path d="M6 4.5h10a2 2 0 0 1 2 2V19H8a2 2 0 0 1-2-2V4.5Z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="14" x2="13" y2="14" />
          <path d="M5 6.5h2v10H5z" />
        </svg>
      );
    case "rubrics":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="6" y="4.5" width="12" height="15" rx="2" />
          <rect x="9" y="3" width="6" height="3" rx="1" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <path d="M9 15l1.2 1.2L12.8 14" />
        </svg>
      );
    case "groups":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <circle cx="8" cy="9" r="2" />
          <circle cx="16" cy="9" r="2" />
          <circle cx="12" cy="7" r="2" />
          <path d="M5.5 17c0-1.7 1.4-3 3-3h7c1.6 0 3 1.3 3 3" />
        </svg>
      );
    case "random":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <circle cx="9" cy="9" r="1" />
          <circle cx="15" cy="9" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="9" cy="15" r="1" />
          <circle cx="15" cy="15" r="1" />
        </svg>
      );
    case "timer":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <circle cx="12" cy="13" r="6" />
          <line x1="12" y1="13" x2="15.5" y2="11" />
          <line x1="12" y1="13" x2="12" y2="9" />
          <path d="M10 3.5h4" />
          <path d="M14.5 6 16.5 4" />
        </svg>
      );
    case "records":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <path d="M5 6a2 2 0 0 1 2-2h10v15H7a2 2 0 0 0-2 2V6Z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <path d="M9 15h3l2-2.4" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className="tile-icon" aria-hidden="true">
          <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
          <line x1="8" y1="3.5" x2="8" y2="7" />
          <line x1="16" y1="3.5" x2="16" y2="7" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <circle cx="9" cy="13.5" r="1" />
          <circle cx="13" cy="13.5" r="1" />
          <circle cx="17" cy="13.5" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

function Layout({ user, onSignOut, preferences, calendarEvents = [], children }) {
  const userEmail = user?.email || "";
  const displayName = formatDisplayName(user);
  const sidebarIdentity =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    userEmail;
  const now = new Date();
  const todayDateLabel = preferences?.dateFormat === "DMY"
    ? format(now, "EEEE, d MMMM yyyy")
    : format(now, "EEEE, MMMM d, yyyy");
  const todayTimeLabel = preferences?.timeFormat === "24h"
    ? format(now, "HH:mm")
    : format(now, "h:mm a");
  const upcomingStickyEvents = useMemo(() => {
    const currentDate = new Date();
    const windowStart = startOfDay(currentDate);
    const windowEnd = endOfDay(addDays(currentDate, 15));
    return calendarEvents
      .filter((item) => {
        if (!item?.event_date) return false;
        const eventDate = parseISO(String(item.event_date));
        if (!isValid(eventDate)) return false;
        return eventDate >= windowStart && eventDate <= windowEnd;
      })
      .sort((a, b) => {
        const firstDate = parseISO(String(a.event_date));
        const secondDate = parseISO(String(b.event_date));
        const dateCompare = firstDate.getTime() - secondDate.getTime();
        if (dateCompare !== 0) return dateCompare;
        if (!!a.is_all_day !== !!b.is_all_day) return a.is_all_day ? -1 : 1;
        return (a.start_time || "").localeCompare(b.start_time || "");
      })
      .slice(0, 4);
  }, [calendarEvents]);
  const navLinks = [
    { label: "Dashboard", path: "/" },
    { label: "Classes", path: "/classes" },
    { label: "Attendance", path: "/attendance" },
    { label: "Gradebook", path: "/assessments" },
    { label: "Groups", path: "/groups" },
    { label: "Calendar", path: "/calendar" },
    { label: "Timer", path: "/timer" },
    { label: "Random Picker", path: "/random" },
    { label: "Running Records", path: "/running-records" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-kicker">Teacher Assistant</p>
          <h1 className="sidebar-title">Classroom Hub</h1>
          <p className="sidebar-email">Signed in as {sidebarIdentity}</p>
        </div>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.path === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <NavLink to="/profile" className="sidebar-account-link">
            Profile
          </NavLink>
          <button type="button" className="secondary sidebar-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <section className="postit postit-greeting">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <p className="postit-kicker">Teacher Assistant</p>
            <h2 className="postit-title">Hello, {displayName}.</h2>
            <p className="postit-line">Today is {todayDateLabel}</p>
            <p className="postit-line">{todayTimeLabel}</p>
          </section>
          <section className="postit postit-events">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <div className="postit-header">
              <h3>Upcoming Events</h3>
              <NavLink to="/calendar" className="postit-calendar-link">
                Calendar
              </NavLink>
            </div>
            {upcomingStickyEvents.length === 0 ? (
              <p className="postit-empty">No events in the next 15 days.</p>
            ) : (
              <ul className="postit-events-list">
                {upcomingStickyEvents.map((item) => {
                  const parsedEventDate = parseISO(String(item.event_date));
                  const eventDateLabel = isValid(parsedEventDate)
                    ? format(parsedEventDate, "EEE, MMM d")
                    : "Date TBD";
                  const parsedStartTime = item.start_time ? parseISO(String(item.start_time)) : null;
                  const eventTimeLabel = item.is_all_day
                    ? "All day"
                    : parsedStartTime && isValid(parsedStartTime)
                      ? format(parsedStartTime, "p")
                      : "Time TBD";
                  return (
                    <li key={item.id}>
                      <span>{eventDateLabel}</span>
                      <strong>{item.title || "Untitled event"}</strong>
                      <em>{eventTimeLabel}</em>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </header>
        <main className="content notebook-board">
          <div className="notebook-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

function TeacherWorkspace({ user, onSignOut }) {
  const [profilePreferences, setProfilePreferences] = useState(() => {
    try {
      const raw = localStorage.getItem("ta_profile_preferences");
      if (!raw) return DEFAULT_PROFILE_PREFERENCES;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE_PREFERENCES,
        ...parsed,
      };
    } catch {
      return DEFAULT_PROFILE_PREFERENCES;
    }
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [_lessonPlans, setLessonPlans] = useState([]);
  const [calendarDiaryEntries, setCalendarDiaryEntries] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarTablesReady, setCalendarTablesReady] = useState(true);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [attendanceEntries, setAttendanceEntries] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentEntries, setAssessmentEntries] = useState([]);
  const [runningRecords, setRunningRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [rubricCategories, setRubricCategories] = useState([]);
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [developmentScores, setDevelopmentScores] = useState([]);
  const [seedingRubrics, setSeedingRubrics] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupConstraints, setGroupConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [classForm, setClassForm] = useState({
    name: "",
    gradeLevel: "",
    schoolYear: "",
    sortOrder: "",
  });
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Prefer not to say",
    classId: "",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
    separationList: "",
    sortOrder: "",
  });

  useEffect(() => {
    localStorage.setItem("ta_profile_preferences", JSON.stringify(profilePreferences));
  }, [profilePreferences]);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    subject: "",
    unit: "",
    scheduledDate: "",
    classId: "",
    notes: "",
  });
  const [attendanceSessionForm, setAttendanceSessionForm] = useState({
    sessionDate: "",
    title: "",
    classId: "",
  });
  const [attendanceEntryForm, setAttendanceEntryForm] = useState({
    sessionId: "",
    studentId: "",
    status: "Present",
    note: "",
  });
  const [assessmentForm, setAssessmentForm] = useState({
    title: "",
    subject: "",
    assessmentDate: "",
    classId: "",
    maxScore: "",
    notes: "",
    sortOrder: "",
  });
  const [assessmentEntryForm, setAssessmentEntryForm] = useState({
    assessmentId: "",
    studentId: "",
    score: "",
    notes: "",
  });
  const [runningRecordForm, setRunningRecordForm] = useState({
    studentId: "",
    recordDate: "",
    textTitle: "",
    totalWords: "",
    errors: "",
    selfCorrections: "",
    notes: "",
  });
  const [subjectForm, setSubjectForm] = useState({
    classId: "",
    name: "",
    description: "",
    sortOrder: "",
  });
  const [unitForm, setUnitForm] = useState({
    subjectId: "",
    name: "",
    description: "",
    sortOrder: "",
  });
  const [developmentScoreForm, setDevelopmentScoreForm] = useState({
    studentId: "",
    criterionId: "",
    rating: "3",
    date: "",
    notes: "",
  });
  const [rubricForm, setRubricForm] = useState({
    title: "",
    subject: "",
    gradeBand: "",
    description: "",
    sortOrder: "",
  });
  const [rubricCategoryForm, setRubricCategoryForm] = useState({
    rubricId: "",
    name: "",
    sortOrder: "",
  });
  const [rubricCriterionForm, setRubricCriterionForm] = useState({
    categoryId: "",
    label: "",
    description: "",
    sortOrder: "",
  });
  const [groupForm, setGroupForm] = useState({
    name: "",
    classId: "",
  });
  const [groupMemberForm, setGroupMemberForm] = useState({
    groupId: "",
    studentId: "",
  });
  const [randomGroupId, setRandomGroupId] = useState("");
  const [_randomResult, setRandomResult] = useState("");
  const [groupGenForm, setGroupGenForm] = useState({
    classId: "",
    size: "3",
    prefix: "Group",
    clearExisting: true,
    balanceGender: false,
    balanceAbility: false,
    pairSupportPartners: false,
    respectSeparations: true,
  });
  const [constraintForm, setConstraintForm] = useState({
    studentA: "",
    studentB: "",
  });
  const [groupsShowAdvanced, setGroupsShowAdvanced] = useState(true);
  const [groupsShowSeparations, setGroupsShowSeparations] = useState(false);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const groupsScrollTopRef = useRef(0);

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        id: item.id,
        label: `${item.name}${item.grade_level ? ` (${item.grade_level})` : ""}`,
      })),
    [classes]
  );

  const loadData = async () => {
    setLoading(true);
    setFormError("");

    const [
      { data: classRows, error: classError },
      { data: studentRows, error: studentError },
      { data: lessonRows, error: lessonError },
      { data: sessionRows, error: sessionError },
      { data: entryRows, error: entryError },
      { data: assessmentRows, error: assessmentError },
      { data: assessmentEntryRows, error: assessmentEntryError },
      { data: runningRecordRows, error: runningRecordError },
      { data: subjectRows, error: subjectError },
      { data: unitRows, error: unitError },
      { data: rubricRows, error: rubricError },
      { data: rubricCategoryRows, error: rubricCategoryError },
      { data: rubricCriterionRows, error: rubricCriterionError },
      { data: devScoreRows, error: devScoreError },
      { data: groupRows, error: groupError },
      { data: groupMemberRows, error: groupMemberError },
      { data: constraintRows, error: constraintError },
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("students")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("lesson_plans").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_sessions").select("*").order("session_date", { ascending: false }),
      supabase.from("attendance_entries").select("*").order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("assessment_date", { ascending: false }),
      supabase.from("assessment_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("running_records").select("*").order("record_date", { ascending: false }),
      supabase
        .from("subjects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("units")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubrics")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubric_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubric_criteria")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("development_scores").select("*").order("created_at", { ascending: false }),
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("group_members").select("*").order("created_at", { ascending: false }),
      supabase.from("group_constraints").select("*").order("created_at", { ascending: false }),
    ]);

    if (
      classError ||
      studentError ||
      lessonError ||
      sessionError ||
      entryError ||
      assessmentError ||
      assessmentEntryError ||
      runningRecordError ||
      subjectError ||
      unitError ||
      rubricError ||
      rubricCategoryError ||
      rubricCriterionError ||
      devScoreError ||
      groupError ||
      groupMemberError ||
      constraintError
    ) {
      setFormError(
        classError?.message ||
          studentError?.message ||
          lessonError?.message ||
          sessionError?.message ||
          entryError?.message ||
          assessmentError?.message ||
          assessmentEntryError?.message ||
          runningRecordError?.message ||
          subjectError?.message ||
          unitError?.message ||
          rubricError?.message ||
          rubricCategoryError?.message ||
          rubricCriterionError?.message ||
          devScoreError?.message ||
          groupError?.message ||
          groupMemberError?.message ||
          constraintError?.message
      );
    } else {
      setClasses(classRows ?? []);
      setStudents(studentRows ?? []);
      setLessonPlans(lessonRows ?? []);
      setAttendanceSessions(sessionRows ?? []);
      setAttendanceEntries(entryRows ?? []);
      setAssessments(assessmentRows ?? []);
      setAssessmentEntries(assessmentEntryRows ?? []);
      setRunningRecords(runningRecordRows ?? []);
      setSubjects(subjectRows ?? []);
      setUnits(unitRows ?? []);
      setRubrics(rubricRows ?? []);
      setRubricCategories(rubricCategoryRows ?? []);
      setRubricCriteria(rubricCriterionRows ?? []);
      setDevelopmentScores(devScoreRows ?? []);
      setGroups(groupRows ?? []);
      setGroupMembers(groupMemberRows ?? []);
      setGroupConstraints(constraintRows ?? []);

      const isMissingTableError = (error) =>
        !!error &&
        (error.code === "42P01" ||
          /does not exist|Could not find the table|schema cache/i.test(error.message || ""));

      const [{ data: diaryRows, error: diaryError }, { data: eventRows, error: eventError }] =
        await Promise.all([
          supabase.from("calendar_diary_entries").select("*").order("entry_date", { ascending: false }),
          supabase.from("calendar_events").select("*").order("event_date", { ascending: false }),
        ]);
      const diaryMissing = isMissingTableError(diaryError);
      const eventMissing = isMissingTableError(eventError);
      setCalendarTablesReady(!diaryMissing && !eventMissing);

      if (diaryError && !diaryMissing) {
        setFormError(diaryError.message);
      } else {
        setCalendarDiaryEntries(diaryRows ?? []);
      }

      if (eventError && !eventMissing) {
        setFormError(eventError.message);
      } else {
        setCalendarEvents(eventRows ?? []);
      }

    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (event) => {
    event.preventDefault();
    setFormError("");

    const maxSortOrder = classes.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)),
      -1
    );
    const inferredSortOrder = maxSortOrder + 1;
    const sortOrder = classForm.sortOrder ? Number(classForm.sortOrder) : inferredSortOrder;
    const payload = {
      name: classForm.name.trim(),
      grade_level: classForm.gradeLevel.trim() || null,
      school_year: classForm.schoolYear.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.name) {
      setFormError("Class name is required.");
      return;
    }

    const { error } = await supabase.from("classes").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setClassForm({ name: "", gradeLevel: "", schoolYear: "", sortOrder: "" });
    await loadData();
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = studentForm.sortOrder ? Number(studentForm.sortOrder) : 0;
    const payload = {
      first_name: studentForm.firstName.trim(),
      last_name: studentForm.lastName.trim(),
      gender: studentForm.gender.trim() || "Prefer not to say",
      class_id: studentForm.classId || null,
      notes: studentForm.notes.trim() || null,
      is_participating_well: !!studentForm.isParticipatingWell,
      needs_help: !!studentForm.needsHelp,
      missing_homework: !!studentForm.missingHomework,
      separation_list: studentForm.separationList.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.first_name || !payload.last_name) {
      setFormError("Student first and last name are required.");
      return false;
    }

    const { data: insertedStudent, error } = await supabase
      .from("students")
      .insert(payload)
      .select("id,class_id")
      .single();
    if (error || !insertedStudent?.id) {
      setFormError(error?.message || "Failed to create student.");
      return false;
    }

    if (insertedStudent.class_id) {
      const { data: classAssessments, error: assessmentsError } = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", insertedStudent.class_id);

      if (assessmentsError) {
        setFormError(`Student created, but assessment linking failed: ${assessmentsError.message}`);
      } else if (classAssessments && classAssessments.length > 0) {
        const rows = classAssessments.map((assessment) => ({
          assessment_id: assessment.id,
          student_id: insertedStudent.id,
          score: null,
          notes: null,
        }));

        const { error: linkError } = await supabase
          .from("assessment_entries")
          .upsert(rows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });

        if (linkError) {
          setFormError(`Student created, but assessment linking failed: ${linkError.message}`);
        }
      }
    }

    setStudentForm({
      firstName: "",
      lastName: "",
      gender: "Prefer not to say",
      classId: "",
      notes: "",
      isParticipatingWell: false,
      needsHelp: false,
      missingHomework: false,
      separationList: "",
      sortOrder: "",
    });
    await loadData();
    return true;
  };

  const handleUpdateStudent = async (studentId, updates) => {
    if (!studentId) return;
    setFormError("");

    const payload = {
      gender: updates.gender?.trim() || "Prefer not to say",
      notes: updates.notes?.trim() || null,
      is_participating_well: !!updates.isParticipatingWell,
      needs_help: !!updates.needsHelp,
      missing_homework: !!updates.missingHomework,
    };

    if (typeof updates.separationList === "string") {
      payload.separation_list = updates.separationList.trim() || null;
    }

    const { error } = await supabase.from("students").update(payload).eq("id", studentId);
    if (error) {
      setFormError(error.message);
      return;
    }

    await loadData();
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Delete this class and all related data?")) return;
    setFormError("");
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleUpdateSortOrder = async (table, id, currentOrder, delta) => {
    if (!id) return;
    const nextOrder = Math.max(0, Number(currentOrder ?? 0) + delta);
    const { error } = await supabase.from(table).update({ sort_order: nextOrder }).eq("id", id);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleSwapSortOrder = async (table, items, draggedId, targetId) => {
    if (!Array.isArray(items) || !draggedId || !targetId || draggedId === targetId) return;

    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...items];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);

    const changedUpdates = reordered
      .map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))
      .filter((update) => {
        const original = items.find((item) => item.id === update.id);
        return Number(original?.sort_order ?? 0) !== update.sort_order;
      });

    if (!changedUpdates.length) return;

    const updateResults = await Promise.all(
      changedUpdates.map((update) =>
        supabase.from(table).update({ sort_order: update.sort_order }).eq("id", update.id)
      )
    );

    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      setFormError(updateError.message);
      return;
    }

    await loadData();
  };

  const _handleCreateLesson = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      title: lessonForm.title.trim(),
      subject: lessonForm.subject.trim() || null,
      unit: lessonForm.unit.trim() || null,
      scheduled_date: lessonForm.scheduledDate || null,
      class_id: lessonForm.classId || null,
      notes: lessonForm.notes.trim() || null,
    };

    if (!payload.title) {
      setFormError("Lesson title is required.");
      return;
    }

    const { error } = await supabase.from("lesson_plans").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setLessonForm({ title: "", subject: "", unit: "", scheduledDate: "", classId: "", notes: "" });
    await loadData();
  };

  const _handleCreateAttendanceSession = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      session_date: attendanceSessionForm.sessionDate,
      title: attendanceSessionForm.title.trim() || null,
      class_id: attendanceSessionForm.classId || null,
    };

    if (!payload.session_date) {
      setFormError("Attendance date is required.");
      return;
    }

    const { error } = await supabase.from("attendance_sessions").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setAttendanceSessionForm({ sessionDate: "", title: "", classId: "" });
    await loadData();
  };

  const _handleCreateAttendanceEntry = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      session_id: attendanceEntryForm.sessionId,
      student_id: attendanceEntryForm.studentId,
      status: attendanceEntryForm.status,
      note: attendanceEntryForm.note.trim() || null,
    };

    if (!payload.session_id || !payload.student_id) {
      setFormError("Select a session and a student.");
      return;
    }

    const { error } = await supabase.from("attendance_entries").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setAttendanceEntryForm({ sessionId: "", studentId: "", status: "Present", note: "" });
    await loadData();
  };

  const handleUpdateAttendanceEntry = async (entryId, updates) => {
    if (!entryId) return;
    setFormError("");
    const { error } = await supabase.from("attendance_entries").update(updates).eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateAssessment = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = assessmentForm.sortOrder ? Number(assessmentForm.sortOrder) : 0;
    const maxScoreValue = assessmentForm.maxScore ? Number(assessmentForm.maxScore) : 10;
    const payload = {
      title: assessmentForm.title.trim(),
      subject: assessmentForm.subject.trim() || null,
      assessment_date: assessmentForm.assessmentDate || null,
      class_id: assessmentForm.classId || null,
      max_score: maxScoreValue,
      notes: assessmentForm.notes.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.title) {
      setFormError("Assessment title is required.");
      return;
    }
    if (!Number.isFinite(payload.max_score) || payload.max_score <= 0) {
      setFormError("Max score must be greater than 0.");
      return;
    }

    const { error } = await supabase.from("assessments").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setAssessmentForm({
      title: "",
      subject: "",
      assessmentDate: "",
      classId: "",
      maxScore: "",
      notes: "",
      sortOrder: "",
    });
    await loadData();
  };

  const _handleCreateAssessmentEntry = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      assessment_id: assessmentEntryForm.assessmentId,
      student_id: assessmentEntryForm.studentId,
      score: assessmentEntryForm.score ? Number(assessmentEntryForm.score) : null,
      notes: assessmentEntryForm.notes.trim() || null,
    };

    if (!payload.assessment_id || !payload.student_id) {
      setFormError("Select an assessment and a student.");
      return;
    }

    const { error } = await supabase
      .from("assessment_entries")
      .upsert(payload, { onConflict: "assessment_id,student_id" });
    if (error) {
      setFormError(
        error.code === "23505"
          ? "This student already has an entry for that assessment."
          : error.message
      );
      return;
    }

    setAssessmentEntryForm({
      assessmentId: "",
      studentId: "",
      score: "",
      notes: "",
    });
    await loadData();
  };

  const handleUpdateAssessmentEntry = async (entryId, updates) => {
    if (!entryId) return;
    setFormError("");
    const { error } = await supabase.from("assessment_entries").update(updates).eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateRunningRecord = async (event) => {
    event.preventDefault();
    setFormError("");

    const totalWords = runningRecordForm.totalWords ? Number(runningRecordForm.totalWords) : 0;
    const errors = runningRecordForm.errors ? Number(runningRecordForm.errors) : 0;
    const selfCorrections = runningRecordForm.selfCorrections
      ? Number(runningRecordForm.selfCorrections)
      : 0;

    if (!runningRecordForm.studentId) {
      setFormError("Select a student for the running record.");
      return false;
    }
    if (!runningRecordForm.recordDate) {
      setFormError("Enter a date for the running record (YYYY-MM-DD).");
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(runningRecordForm.recordDate)) {
      setFormError("Date format should be YYYY-MM-DD.");
      return false;
    }
    if (!Number.isFinite(totalWords) || totalWords <= 0) {
      setFormError("Total words must be greater than 0.");
      return false;
    }
    if (errors < 0 || selfCorrections < 0) {
      setFormError("Errors and self-corrections must be 0 or more.");
      return false;
    }

    const accuracy = ((totalWords - errors) / totalWords) * 100;
    let level = "Frustration (<90%)";
    if (accuracy >= 95) level = "Independent (95-100%)";
    else if (accuracy >= 90) level = "Instructional (90-94%)";

    const scRatio = selfCorrections > 0 ? (errors + selfCorrections) / selfCorrections : null;

    const payload = {
      student_id: runningRecordForm.studentId,
      record_date: runningRecordForm.recordDate,
      text_title: runningRecordForm.textTitle.trim() || null,
      total_words: totalWords,
      errors,
      self_corrections: selfCorrections,
      accuracy_pct: Math.round(accuracy * 10) / 10,
      level,
      sc_ratio: scRatio ? Math.round(scRatio * 10) / 10 : null,
      notes: runningRecordForm.notes.trim() || null,
    };

    const { error } = await supabase.from("running_records").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    setRunningRecordForm({
      studentId: "",
      recordDate: "",
      textTitle: "",
      totalWords: "",
      errors: "",
      selfCorrections: "",
      notes: "",
    });
    await loadData();
    return true;
  };

  const handleDeleteRunningRecord = async (recordId) => {
    if (!recordId) return;
    if (!window.confirm("Delete this running record?")) return;
    setFormError("");
    const { error } = await supabase.from("running_records").delete().eq("id", recordId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateSubject = async (event, classIdOverride) => {
    event.preventDefault();
    setFormError("");

    const targetClassId = classIdOverride || subjectForm.classId;
    const maxSortOrder = subjects
      .filter((item) => item.class_id === targetClassId)
      .reduce((maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)), -1);
    const inferredSortOrder = maxSortOrder + 1;
    const sortOrder = subjectForm.sortOrder ? Number(subjectForm.sortOrder) : inferredSortOrder;
    const payload = {
      class_id: targetClassId,
      name: subjectForm.name.trim(),
      description: subjectForm.description.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.class_id || !payload.name) {
      setFormError("Select a class and enter a subject name.");
      return;
    }

    const { error } = await supabase.from("subjects").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setSubjectForm({ classId: "", name: "", description: "", sortOrder: "" });
    await loadData();
  };

  const handleCreateUnit = async (event, subjectIdOverride) => {
    event.preventDefault();
    setFormError("");

    const targetSubjectId = subjectIdOverride || unitForm.subjectId;
    const sortOrder = unitForm.sortOrder ? Number(unitForm.sortOrder) : null;
    const inferredSortOrder =
      units
        .filter((unit) => unit.subject_id === targetSubjectId)
        .reduce((maxValue, unit) => Math.max(maxValue, Number(unit.sort_order ?? -1)), -1) + 1;
    const payload = {
      subject_id: targetSubjectId,
      name: unitForm.name.trim(),
      description: unitForm.description.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : inferredSortOrder,
    };

    if (!payload.subject_id || !payload.name) {
      setFormError("Select a subject and enter a unit name.");
      return;
    }

    const { error } = await supabase.from("units").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setUnitForm({ subjectId: "", name: "", description: "", sortOrder: "" });
    await loadData();
  };

  const handleDeleteUnit = async (unitId) => {
    if (!unitId) return;
    setFormError("");
    const { error } = await supabase.from("units").delete().eq("id", unitId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateAssessmentForUnit = async (event, unitId, subjectId, classId, formValues = null) => {
    event.preventDefault();
    setFormError("");

    const form = event.target;
    const title = (formValues?.title ?? form.elements["title"]?.value ?? "").trim();
    const assessmentDate = (formValues?.assessmentDate ?? form.elements["assessmentDate"]?.value) || null;
    const maxScoreRaw = formValues?.maxScore ?? form.elements["maxScore"]?.value;
    const maxScore = maxScoreRaw ? Number(maxScoreRaw) : 10;
    const inferredSortOrder =
      assessments
        .filter((item) => item.unit_id === unitId)
        .reduce((maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)), -1) + 1;

    if (!title) {
      setFormError("Assessment title is required.");
      return false;
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setFormError("Max score must be greater than 0.");
      return false;
    }

    const payload = {
      title,
      assessment_date: assessmentDate,
      max_score: maxScore,
      class_id: classId || null,
      subject_id: subjectId || null,
      unit_id: unitId || null,
      sort_order: inferredSortOrder,
    };

    const { data: insertedAssessment, error } = await supabase
      .from("assessments")
      .insert(payload)
      .select("id")
      .single();
    if (error || !insertedAssessment?.id) {
      setFormError(error?.message || "Failed to create assessment.");
      return false;
    }

    if (classId) {
      const classStudents = students.filter((student) => student.class_id === classId);
      if (classStudents.length > 0) {
        const entryRows = classStudents.map((student) => ({
          assessment_id: insertedAssessment.id,
          student_id: student.id,
          score: null,
          notes: null,
        }));

        const { error: entriesError } = await supabase
          .from("assessment_entries")
          .upsert(entryRows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });
        if (entriesError) {
          setFormError(
            `Assessment created, but assigning students failed: ${entriesError.message}`
          );
        }
      }
    }

    form.reset();
    await loadData();
    return true;
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!assessmentId) return;
    setFormError("");
    const { error } = await supabase.from("assessments").delete().eq("id", assessmentId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCopyAssessmentsFromUnit = async (
    sourceUnitId,
    targetUnitId,
    targetSubjectId,
    targetClassId
  ) => {
    if (!sourceUnitId || !targetUnitId) return;
    setFormError("");

    const sourceUnit = units.find((item) => item.id === sourceUnitId);
    const targetUnit = units.find((item) => item.id === targetUnitId);
    const sourceSubject = subjects.find((item) => item.id === sourceUnit?.subject_id);
    const targetSubject =
      subjects.find((item) => item.id === targetUnit?.subject_id) ||
      subjects.find((item) => item.id === targetSubjectId);

    if (!sourceUnit || !targetUnit || !sourceSubject || !targetSubject) {
      setFormError("Invalid source or target selection.");
      return;
    }

    if (sourceSubject.class_id !== targetSubject.class_id) {
      setFormError("Copy is only allowed between units of the same class/year.");
      return;
    }

    const sourceAssessments = assessments
      .filter((item) => item.unit_id === sourceUnitId)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

    if (sourceAssessments.length === 0) {
      setFormError("No assessments found in selected source unit.");
      return;
    }

    const existingCount = assessments.filter((item) => item.unit_id === targetUnitId).length;
    const rows = sourceAssessments.map((item, index) => ({
      title: item.title,
      assessment_date: null,
      max_score: item.max_score ?? null,
      notes: null,
      class_id: targetClassId || null,
      subject_id: targetSubjectId || null,
      unit_id: targetUnitId,
      sort_order: existingCount + index,
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from("assessments")
      .insert(rows)
      .select("id");

    if (insertError || !insertedRows) {
      setFormError(insertError?.message || "Failed to copy assessments.");
      return;
    }

    if (targetClassId) {
      const classStudents = students.filter((student) => student.class_id === targetClassId);
      if (classStudents.length > 0) {
        const entryRows = [];
        insertedRows.forEach((assessment) => {
          classStudents.forEach((student) => {
            entryRows.push({
              assessment_id: assessment.id,
              student_id: student.id,
              score: null,
              notes: null,
            });
          });
        });

        const { error: entriesError } = await supabase
          .from("assessment_entries")
          .upsert(entryRows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });
        if (entriesError) {
          setFormError(`Assessments copied, but assigning students failed: ${entriesError.message}`);
        }
      }
    }

    await loadData();
  };

  const handleCreateDevelopmentScore = async (event, studentIdOverride) => {
    event.preventDefault();
    await handleCreateDevelopmentScoreEntry({
      studentId: studentIdOverride || developmentScoreForm.studentId,
      criterionId: developmentScoreForm.criterionId,
      rating: developmentScoreForm.rating,
      date: developmentScoreForm.date,
      notes: developmentScoreForm.notes,
    });
  };

  const handleCreateDevelopmentScoreEntry = async ({
    studentId,
    criterionId,
    rating,
    date,
    notes,
  }) => {
    setFormError("");

    const payload = {
      student_id: studentId,
      criterion_id: criterionId,
      rating: Number(rating),
      score_date: date || null,
      notes: notes?.trim() || null,
    };

    if (!payload.student_id || !payload.criterion_id) {
      setFormError("Select a student and a rubric criterion.");
      return false;
    }
    if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return false;
    }

    const { error } = await supabase.from("development_scores").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    setDevelopmentScoreForm({
      studentId: "",
      criterionId: "",
      rating: "3",
      date: "",
      notes: "",
    });
    await loadData();
    return true;
  };

  const handleUpdateDevelopmentScore = async (scoreId, updates) => {
    if (!scoreId) return false;
    setFormError("");
    const nextRating = Number(updates?.rating);
    if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return false;
    }

    const payload = {
      rating: nextRating,
      score_date: updates?.date || null,
      notes: updates?.notes?.trim() || null,
    };

    const { error } = await supabase.from("development_scores").update(payload).eq("id", scoreId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const _handleCreateRubric = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = rubricForm.sortOrder ? Number(rubricForm.sortOrder) : 0;
    const payload = {
      title: rubricForm.title.trim(),
      subject: rubricForm.subject.trim() || null,
      grade_band: rubricForm.gradeBand.trim() || null,
      description: rubricForm.description.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.title) {
      setFormError("Rubric title is required.");
      return;
    }

    const { error } = await supabase.from("rubrics").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setRubricForm({ title: "", subject: "", gradeBand: "", description: "", sortOrder: "" });
    await loadData();
  };

  const _handleCreateRubricCategory = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = rubricCategoryForm.sortOrder ? Number(rubricCategoryForm.sortOrder) : 0;
    const payload = {
      rubric_id: rubricCategoryForm.rubricId,
      name: rubricCategoryForm.name.trim(),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.rubric_id || !payload.name) {
      setFormError("Select a rubric and enter a category name.");
      return;
    }

    const { error } = await supabase.from("rubric_categories").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setRubricCategoryForm({ rubricId: "", name: "", sortOrder: "" });
    await loadData();
  };

  const _handleCreateRubricCriterion = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = rubricCriterionForm.sortOrder ? Number(rubricCriterionForm.sortOrder) : 0;
    const payload = {
      category_id: rubricCriterionForm.categoryId,
      label: rubricCriterionForm.label.trim() || null,
      description: rubricCriterionForm.description.trim(),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.category_id || !payload.description) {
      setFormError("Select a category and enter a criterion description.");
      return;
    }

    const { error } = await supabase.from("rubric_criteria").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setRubricCriterionForm({ categoryId: "", label: "", description: "", sortOrder: "" });
    await loadData();
  };

  const handleSeedDefaultRubrics = async () => {
    setFormError("");
    setSeedingRubrics(true);

    const existingTitles = new Set(
      rubrics.map((rubric) => rubric.title.trim().toLowerCase())
    );

    try {
      for (const rubric of DEFAULT_RUBRICS) {
        if (existingTitles.has(rubric.title.trim().toLowerCase())) {
          continue;
        }
        const { data: rubricRow, error: rubricError } = await supabase
          .from("rubrics")
          .insert({
            title: rubric.title,
            subject: rubric.subject,
            grade_band: rubric.gradeBand,
            description: rubric.description ?? null,
          })
          .select()
          .single();

        if (rubricError) throw rubricError;

        for (const category of rubric.categories) {
          const { data: categoryRow, error: categoryError } = await supabase
            .from("rubric_categories")
            .insert({
              rubric_id: rubricRow.id,
              name: category.name,
            })
            .select()
            .single();

          if (categoryError) throw categoryError;

          const criteriaRows = category.criteria.map((criterion) => ({
            category_id: categoryRow.id,
            label: criterion.label,
            description: criterion.description,
          }));

          if (criteriaRows.length > 0) {
            const { error: criteriaError } = await supabase
              .from("rubric_criteria")
              .insert(criteriaRows);
            if (criteriaError) throw criteriaError;
          }
        }
      }
    } catch (error) {
      setFormError(error.message || "Failed to seed default rubrics.");
      setSeedingRubrics(false);
      return;
    }

    await loadData();
    setSeedingRubrics(false);
  };

  const _handleCreateGroup = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      name: groupForm.name.trim(),
      class_id: groupForm.classId || null,
    };

    if (!payload.name) {
      setFormError("Group name is required.");
      return;
    }

    const { error } = await supabase.from("groups").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setGroupForm({ name: "", classId: "" });
    await loadData();
  };

  const _handleAddGroupMember = async (event) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      group_id: groupMemberForm.groupId,
      student_id: groupMemberForm.studentId,
    };

    if (!payload.group_id || !payload.student_id) {
      setFormError("Select a group and a student.");
      return;
    }

    const { error } = await supabase.from("group_members").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setGroupMemberForm({ groupId: "", studentId: "" });
    await loadData();
  };

  const handleAddConstraint = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setFormError("");

    const studentA = constraintForm.studentA;
    const studentB = constraintForm.studentB;

    if (!studentA || !studentB || studentA === studentB) {
      setFormError("Select two different students.");
      return;
    }

    const [firstId, secondId] = studentA < studentB ? [studentA, studentB] : [studentB, studentA];

    const { error } = await supabase.from("group_constraints").insert({
      student_a: firstId,
      student_b: secondId,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setConstraintForm({ studentA: "", studentB: "" });
    await loadData();
  };

  const handleDeleteConstraint = async (constraintId) => {
    if (!constraintId) return;
    if (!window.confirm("Delete this separation rule?")) return;
    setFormError("");
    const { error } = await supabase.from("group_constraints").delete().eq("id", constraintId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const buildConstraintSet = (studentList) => {
    const set = new Set();
    const studentIdSet = new Set(studentList.map((student) => student.id));
    const addPair = (a, b) => {
      if (!studentIdSet.has(a) || !studentIdSet.has(b) || a === b) return;
      const [firstId, secondId] = a < b ? [a, b] : [b, a];
      set.add(`${firstId}|${secondId}`);
    };
    groupConstraints.forEach((constraint) => {
      addPair(constraint.student_a, constraint.student_b);
    });
    studentList.forEach((student) => {
      const rawList = student.separation_list || "";
      rawList
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((otherId) => addPair(student.id, otherId));
    });
    return set;
  };

  const canJoinGroup = (studentId, group, constraintSet) => {
    for (const memberId of group) {
      const [firstId, secondId] =
        studentId < memberId ? [studentId, memberId] : [memberId, studentId];
      if (constraintSet.has(`${firstId}|${secondId}`)) {
        return false;
      }
    }
    return true;
  };

  const shuffleArray = (input) => {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const normalizeGender = (value) => (value || "").trim().toLowerCase();

  const buildAbilityProfiles = (classId, classStudents) => {
    const classAssessmentMap = new Map(
      assessments
        .filter((assessment) => assessment.class_id === classId)
        .map((assessment) => [assessment.id, assessment])
    );
    const scoreSamplesByStudent = new Map();

    assessmentEntries.forEach((entry) => {
      const assessment = classAssessmentMap.get(entry.assessment_id);
      if (!assessment) return;
      const percent = scoreToPercent(entry.score, getAssessmentMaxScore(assessment));
      if (!Number.isFinite(percent)) return;
      if (!scoreSamplesByStudent.has(entry.student_id)) {
        scoreSamplesByStudent.set(entry.student_id, []);
      }
      scoreSamplesByStudent.get(entry.student_id).push(percent);
    });

    const averages = classStudents
      .map((student) => {
        const samples = scoreSamplesByStudent.get(student.id) || [];
        if (samples.length === 0) return null;
        return averageFromPercents(samples);
      })
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const lowerIndex = averages.length
      ? Math.max(0, Math.floor((averages.length - 1) * 0.33))
      : -1;
    const upperIndex = averages.length
      ? Math.max(0, Math.floor((averages.length - 1) * 0.66))
      : -1;
    const lowerThreshold = lowerIndex >= 0 ? averages[lowerIndex] : null;
    const upperThreshold = upperIndex >= 0 ? averages[upperIndex] : null;

    const abilityByStudentId = new Map();

    classStudents.forEach((student) => {
      const samples = scoreSamplesByStudent.get(student.id) || [];
      const avgPercent = samples.length ? averageFromPercents(samples) : null;
      let abilityBand = "unknown";
      let abilityRank = 1;

      if (Number.isFinite(avgPercent)) {
        if (!Number.isFinite(lowerThreshold) || !Number.isFinite(upperThreshold)) {
          abilityBand = "proficient";
          abilityRank = 1;
        } else if (avgPercent <= lowerThreshold) {
          abilityBand = "developing";
          abilityRank = 0;
        } else if (avgPercent >= upperThreshold) {
          abilityBand = "advanced";
          abilityRank = 2;
        } else {
          abilityBand = "proficient";
          abilityRank = 1;
        }
      }

      abilityByStudentId.set(student.id, {
        averagePercent: avgPercent,
        band: abilityBand,
        rank: abilityRank,
        isSupportPartner:
          !student.needs_help &&
          Number.isFinite(avgPercent) &&
          (abilityBand === "advanced" || avgPercent >= 75),
      });
    });

    return abilityByStudentId;
  };

  const pickBestStudent = (candidates, group, constraintSet, options, abilityByStudentId) => {
    let filtered = candidates.filter((student) =>
      canJoinGroup(student.id, group.map((g) => g.id), constraintSet)
    );
    if (filtered.length === 0) return null;

    if (options.balanceGender && group.length > 0) {
      const groupGenders = new Set(group.map((s) => normalizeGender(s.gender)));
      const differentGender = filtered.find(
        (student) => !groupGenders.has(normalizeGender(student.gender))
      );
      if (differentGender) return differentGender;
    }

    if (options.pairSupportPartners && group.length > 0) {
      const hasNeedsHelp = group.some((s) => s.needs_help);
      const hasSupportPartner = group.some(
        (s) => abilityByStudentId.get(s.id)?.isSupportPartner
      );

      if (hasNeedsHelp && !hasSupportPartner) {
        const candidate = filtered.find(
          (s) => !s.needs_help && abilityByStudentId.get(s.id)?.isSupportPartner
        );
        if (candidate) return candidate;
      }

      if (hasSupportPartner && !hasNeedsHelp) {
        const candidate = filtered.find((s) => s.needs_help);
        if (candidate) return candidate;
      }
    }

    if (options.balanceAbility && group.length > 0) {
      const bandCounts = group.reduce((acc, student) => {
        const band = abilityByStudentId.get(student.id)?.band || "unknown";
        acc.set(band, (acc.get(band) || 0) + 1);
        return acc;
      }, new Map());

      const ranked = [...filtered].sort((a, b) => {
        const aBand = abilityByStudentId.get(a.id)?.band || "unknown";
        const bBand = abilityByStudentId.get(b.id)?.band || "unknown";
        const aBandCount = bandCounts.get(aBand) || 0;
        const bBandCount = bandCounts.get(bBand) || 0;
        if (aBandCount !== bBandCount) return aBandCount - bBandCount;

        const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
        const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
        if (aRank !== bRank) return aRank - bRank;

        const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
        const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
        return aAvg - bAvg;
      });

      if (ranked.length > 0) return ranked[0];
    }

    return filtered[0];
  };

  const generateGroups = (
    studentList,
    groupSize,
    constraintSet,
    options,
    abilityByStudentId,
    maxAttempts = 200
  ) => {
    if (studentList.length === 0) return [];
    const size = Math.max(2, groupSize);
    let available = [...studentList];

    if (options.balanceAbility) {
      available.sort((a, b) => {
        const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
        const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
        if (aRank !== bRank) return aRank - bRank;
        const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
        const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
        return aAvg - bAvg;
      });
    } else if (options.pairSupportPartners) {
      available.sort((a, b) => (a.needs_help ? 0 : 1) - (b.needs_help ? 0 : 1));
    } else {
      available = shuffleArray(available);
    }

    const groupsDraft = [];
    let attempts = 0;

    while (available.length > 0 && attempts < maxAttempts) {
      attempts += 1;
      const group = [];

      while (group.length < size && available.length > 0 && attempts < maxAttempts) {
        const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
        if (!candidate) break;
        group.push(candidate);
        available = available.filter((s) => s.id !== candidate.id);
      }

      if (group.length > 0) groupsDraft.push(group);
    }

    return groupsDraft;
  };

  const handleGenerateGroups = async () => {
    if (isGeneratingGroups) return;
    setIsGeneratingGroups(true);
    setFormError("");
    setRandomResult("");
    try {
      const classId = groupGenForm.classId;
      const size = Number(groupGenForm.size);
      const prefix = groupGenForm.prefix.trim() || "Group";
      const clearExisting = groupGenForm.clearExisting;
      const balanceGender = groupGenForm.balanceGender;
      const balanceAbility = groupGenForm.balanceAbility;
      const pairSupportPartners = groupGenForm.pairSupportPartners;
      const respectSeparations = groupGenForm.respectSeparations;

      if (!classId) {
        setFormError("Select a class to generate groups.");
        return;
      }
      if (!Number.isFinite(size) || size < 2) {
        setFormError("Group size must be 2 or more.");
        return;
      }

      const classStudents = students.filter((student) => student.class_id === classId);
      if (classStudents.length === 0) {
        setFormError("No students found in that class.");
        return;
      }

      const constraintSet = respectSeparations ? buildConstraintSet(classStudents) : new Set();
      const abilityByStudentId = buildAbilityProfiles(classId, classStudents);
      const groupList = generateGroups(
        classStudents,
        size,
        constraintSet,
        { balanceGender, balanceAbility, pairSupportPartners, respectSeparations },
        abilityByStudentId
      );
      if (!groupList) {
        setFormError("Could not satisfy the grouping rules. Try adjusting constraints or size.");
        return;
      }

      if (clearExisting) {
        const { data: existingGroups, error: groupFetchError } = await supabase
          .from("groups")
          .select("id")
          .eq("class_id", classId);
        if (groupFetchError) {
          setFormError(groupFetchError.message);
          return;
        }
        const existingIds = (existingGroups ?? []).map((g) => g.id);
        if (existingIds.length > 0) {
          const { error: memberDeleteError } = await supabase
            .from("group_members")
            .delete()
            .in("group_id", existingIds);
          if (memberDeleteError) {
            setFormError(memberDeleteError.message);
            return;
          }
          const { error: groupDeleteError } = await supabase
            .from("groups")
            .delete()
            .in("id", existingIds);
          if (groupDeleteError) {
            setFormError(groupDeleteError.message);
            return;
          }
        }
      }

      const createdGroups = [];
      for (let index = 0; index < groupList.length; index += 1) {
        const label = `${prefix} ${index + 1}`;
        const { data, error } = await supabase
          .from("groups")
          .insert({ name: label, class_id: classId })
          .select()
          .single();
        if (error) {
          setFormError(error.message);
          return;
        }
        createdGroups.push(data);
      }

      const memberRows = groupList.flatMap((memberList, idx) =>
        memberList.map((student) => ({
          group_id: createdGroups[idx].id,
          student_id: student.id,
        }))
      );

      const { error: memberError } = await supabase.from("group_members").insert(memberRows);
      if (memberError) {
        setFormError(memberError.message);
        return;
      }

      await loadData();
      setRandomResult(`Generated ${groupList.length} groups for the class.`);
    } finally {
      setIsGeneratingGroups(false);
    }
  };

  const pickRandomStudent = (list) => {
    if (!list.length) {
      setRandomResult("No students available.");
      return;
    }
    const randomStudent = list[Math.floor(Math.random() * list.length)];
    setRandomResult(`${randomStudent.first_name} ${randomStudent.last_name}`);
  };

  const _handleRandomAll = () => {
    setRandomGroupId("");
    pickRandomStudent(students);
  };

  const _handleRandomFromGroup = () => {
    if (!randomGroupId) {
      setRandomResult("Select a group first.");
      return;
    }
    const memberIds = groupMembers
      .filter((member) => member.group_id === randomGroupId)
      .map((member) => member.student_id);
    const memberStudents = students.filter((student) => memberIds.includes(student.id));
    pickRandomStudent(memberStudents);
  };

  const timerPresets = [
    { minutes: 1, label: "1 min", color: "#2563eb", icon: "🐇" },
    { minutes: 5, label: "5 min", color: "#16a34a", icon: "⚡" },
    { minutes: 10, label: "10 min", color: "#f97316", icon: "🔥" },
    { minutes: 15, label: "15 min", color: "#7c3aed", icon: "⭐" },
    { minutes: 30, label: "30 min", color: "#ec4899", icon: "💗" },
    { minutes: 45, label: "45 min", color: "#4f46e5", icon: "✨" },
    { minutes: 60, label: "1 hour", color: "#dc2626", icon: "⏲️" },
  ];

  const timerIntervalRef = useRef(null);
  const timerAudioRef = useRef(null);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerIsExpanded, setTimerIsExpanded] = useState(false);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [timerShowTimesUp, setTimerShowTimesUp] = useState(false);

  const stopTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopTimerSound = useCallback(() => {
    if (timerAudioRef.current) {
      timerAudioRef.current.pause();
      timerAudioRef.current.currentTime = 0;
      timerAudioRef.current.onended = null;
      timerAudioRef.current = null;
    }
  }, []);

  const playTimerSound = useCallback(() => {
    try {
      stopTimerSound();
      const audio = new Audio("/timer_end.wav");
      audio.loop = false;
      audio.onended = () => {
        if (timerAudioRef.current === audio) {
          timerAudioRef.current = null;
        }
      };
      audio.play().catch(() => {});
      timerAudioRef.current = audio;
    } catch {
      console.warn("Timer sound failed to play.");
    }
  }, [stopTimerSound]);

  const resetTimer = useCallback(() => {
    stopTimerSound();
    stopTimerInterval();
    setTimerShowTimesUp(false);
    setTimerIsRunning(false);
    setTimerIsExpanded(false);
    setTimerTotalSeconds(0);
    setTimerRemainingSeconds(0);
  }, [stopTimerInterval, stopTimerSound]);

  const dismissTimesUpAndReset = () => {
    resetTimer();
  };

  const startTimerSeconds = (seconds) => {
    resetTimer();
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setTimerShowTimesUp(false);
    setTimerTotalSeconds(seconds);
    setTimerRemainingSeconds(seconds);
    setTimerIsRunning(true);
    setTimerIsExpanded(true);
  };

  const stopTimer = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!timerIsRunning) {
      stopTimerInterval();
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimerRemainingSeconds((prev) => {
        if (prev <= 1) {
          stopTimerInterval();
          setTimerIsRunning(false);
          setTimerShowTimesUp(true);
          playTimerSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => stopTimerInterval();
  }, [timerIsRunning, playTimerSound, stopTimerInterval]);

  useEffect(() => {
    return () => {
      stopTimerInterval();
      stopTimerSound();
    };
  }, [stopTimerInterval, stopTimerSound]);

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const timerProgress =
    timerTotalSeconds > 0 ? timerRemainingSeconds / timerTotalSeconds : 0;
  const timerProgressColor =
    timerProgress > 0.5 ? "#22c55e" : timerProgress > 0.2 ? "#f59e0b" : "#ef4444";

  const timerTimeRemaining = () => {
    const minutes = Math.floor(timerRemainingSeconds / 60);
    const seconds = timerRemainingSeconds % 60;
    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
    }
    return `${seconds} second${seconds === 1 ? "" : "s"} remaining`;
  };

  const tiles = [
    { label: "Classes", path: "/classes", accent: "#c9604a", icon: "classes", iconTilt: -1.2, iconX: -0.7, iconY: -0.5, iconStroke: 1.95, wobbleMs: 950 },
    { label: "Attendance", path: "/attendance", accent: "#6f8f5f", icon: "attendance", iconTilt: 0.8, iconX: 0.3, iconY: -0.6, iconStroke: 1.8, wobbleMs: 980 },
    { label: "Gradebook", path: "/assessments", accent: "#cf8a4b", icon: "gradebook", iconTilt: -0.4, iconX: -0.4, iconY: -0.3, iconStroke: 1.85, wobbleMs: 1020 },
    { label: "Rubrics", path: "/rubrics", accent: "#8a74b0", icon: "rubrics", iconTilt: 1.1, iconX: 0.5, iconY: -0.2, iconStroke: 1.75, wobbleMs: 930 },
    { label: "Groups", path: "/groups", accent: "#5f9b99", icon: "groups", iconTilt: -0.8, iconX: -0.2, iconY: -0.5, iconStroke: 1.9, wobbleMs: 970 },
    { label: "Random Picker", path: "/random", accent: "#be6973", icon: "random", iconTilt: 0.6, iconX: 0.6, iconY: -0.4, iconStroke: 1.82, wobbleMs: 1010 },
    { label: "Timer", path: "/timer", accent: "#c36f4b", icon: "timer", iconTilt: -1, iconX: -0.5, iconY: -0.3, iconStroke: 1.88, wobbleMs: 990 },
    { label: "Running Records", path: "/running-records", accent: "#69885f", icon: "records", iconTilt: 0.9, iconX: 0.4, iconY: -0.5, iconStroke: 1.78, wobbleMs: 940 },
    { label: "Calendar", path: "/calendar", accent: "#6384b5", icon: "calendar", iconTilt: -0.5, iconX: -0.4, iconY: -0.4, iconStroke: 1.86, wobbleMs: 1000 },
  ];

  const PlaceholderPage = ({ title, message }) => (
    <section className="panel">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
    </section>
  );

  const TimerPage = () => {
    const timerPrefsKey = "ta_timer_custom_duration";

    const [customMinutes, setCustomMinutes] = useState(() => {
      try {
        const raw = localStorage.getItem(timerPrefsKey);
        if (!raw) return 5;
        const parsed = JSON.parse(raw);
        const minutes = Number(parsed?.minutes);
        if (!Number.isInteger(minutes)) return 5;
        return Math.max(0, Math.min(180, minutes));
      } catch {
        return 5;
      }
    });
    const [customSeconds, setCustomSeconds] = useState(() => {
      try {
        const raw = localStorage.getItem(timerPrefsKey);
        if (!raw) return 0;
        const parsed = JSON.parse(raw);
        const seconds = Number(parsed?.seconds);
        if (!Number.isInteger(seconds)) return 0;
        return Math.max(0, Math.min(59, seconds));
      } catch {
        return 0;
      }
    });

    useEffect(() => {
      localStorage.setItem(
        timerPrefsKey,
        JSON.stringify({ minutes: customMinutes, seconds: customSeconds })
      );
    }, [customMinutes, customSeconds]);

    const totalCustomSeconds = customMinutes * 60 + customSeconds;

    return (
      <section className="panel timer-page">
        <div className="timer-header-card">
          <div className="timer-header-copy">
            <span className="timer-kicker">Focus Tool</span>
            <h2>Classroom Timer</h2>
            <p className="muted">Choose a duration and keep every activity on track.</p>
          </div>
          <div className="timer-icon" aria-hidden="true">⏱️</div>
        </div>

        <div className="timer-section">
          <h3>Quick Timers</h3>
          <div className="timer-presets">
            {timerPresets.map((preset) => (
              <button
                key={preset.minutes}
                type="button"
                className="timer-preset"
                style={{ borderColor: preset.color, background: `${preset.color}22` }}
                onClick={() => startTimerSeconds(preset.minutes * 60)}
              >
                <div className="timer-preset-icon" style={{ color: preset.color }}>
                  {preset.icon}
                </div>
                <div className="timer-preset-label">{preset.label}</div>
                <div className="timer-preset-sub">{preset.minutes} min</div>
              </button>
            ))}
          </div>
        </div>

        <div className="timer-section">
          <h3>Custom Timer</h3>
          <div className="timer-custom-card">
            <div className="timer-display">
              <span>{String(customMinutes).padStart(2, "0")}</span>
              <span>:</span>
              <span>{String(customSeconds).padStart(2, "0")}</span>
            </div>
            <p className="timer-custom-hint">Set your exact countdown length</p>

            <div className="timer-picker-row">
              <label className="stack">
                <span>Minutes</span>
                <select
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(Number(event.target.value))}
                >
                  {Array.from({ length: 181 }).map((_, idx) => (
                    <option key={idx} value={idx}>
                      {idx}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Seconds</span>
                <select
                  value={customSeconds}
                  onChange={(event) => setCustomSeconds(Number(event.target.value))}
                >
                  {Array.from({ length: 60 }).map((_, idx) => (
                    <option key={idx} value={idx}>
                      {idx}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="timer-start-btn"
              disabled={totalCustomSeconds === 0}
              onClick={() => startTimerSeconds(totalCustomSeconds)}
            >
              ▶ Start Custom Timer
            </button>
          </div>
        </div>
      </section>
    );
  };

  const TimerOverlay = () => {
    const clampedProgress = Math.max(0, Math.min(1, timerProgress));
    const topSandHeight = 108 * clampedProgress;
    const topSandY = 150 - topSandHeight;
    const bottomSandHeight = 108 * (1 - clampedProgress);
    const bottomSandY = 258 - bottomSandHeight;
    const streamOpacity = timerRemainingSeconds > 0 ? 1 : 0;

    return (
      <div className="timer-overlay">
        <div className="timer-overlay-card">
          <div className="timer-visual">
            <div className="timer-hourglass-wrap">
              <svg className="timer-hourglass" viewBox="0 0 220 300" aria-hidden="true">
                <defs>
                  <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8a5a2b" />
                    <stop offset="100%" stopColor="#5b3717" />
                  </linearGradient>
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(219, 234, 254, 0.55)" />
                    <stop offset="100%" stopColor="rgba(125, 211, 252, 0.2)" />
                  </linearGradient>
                  <linearGradient id="sandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <clipPath id="topBulbClip">
                    <path d="M110 42 C78 42 58 64 58 94 C58 116 78 136 100 146 L110 150 L120 146 C142 136 162 116 162 94 C162 64 142 42 110 42 Z" />
                  </clipPath>
                  <clipPath id="bottomBulbClip">
                    <path d="M110 258 C78 258 58 236 58 206 C58 184 78 164 100 154 L110 150 L120 154 C142 164 162 184 162 206 C162 236 142 258 110 258 Z" />
                  </clipPath>
                </defs>

                <ellipse cx="110" cy="22" rx="74" ry="16" className="hourglass-frame" />
                <ellipse cx="110" cy="278" rx="74" ry="16" className="hourglass-frame" />
                <rect x="30" y="28" width="14" height="244" rx="7" className="hourglass-post" />
                <rect x="176" y="28" width="14" height="244" rx="7" className="hourglass-post" />
                <circle cx="37" cy="24" r="6" className="hourglass-cap" />
                <circle cx="183" cy="24" r="6" className="hourglass-cap" />
                <circle cx="37" cy="276" r="6" className="hourglass-cap" />
                <circle cx="183" cy="276" r="6" className="hourglass-cap" />

                <path className="hourglass-glass" d="M110 42 C78 42 58 64 58 94 C58 116 78 136 100 146 L110 150 L120 146 C142 136 162 116 162 94 C162 64 142 42 110 42 Z" />
                <path className="hourglass-glass" d="M110 258 C78 258 58 236 58 206 C58 184 78 164 100 154 L110 150 L120 154 C142 164 162 184 162 206 C162 236 142 258 110 258 Z" />
                <circle className="hourglass-neck" cx="110" cy="150" r="4.5" />

                <rect
                  x="56"
                  y={topSandY}
                  width="108"
                  height={topSandHeight}
                  fill="url(#sandGradient)"
                  clipPath="url(#topBulbClip)"
                />
                <rect
                  x="56"
                  y={bottomSandY}
                  width="108"
                  height={bottomSandHeight}
                  fill="url(#sandGradient)"
                  clipPath="url(#bottomBulbClip)"
                />
                <rect
                  className="hourglass-stream"
                  x="108"
                  y="132"
                  width="4"
                  height="36"
                  rx="2"
                  fill="url(#sandGradient)"
                  style={{ opacity: streamOpacity }}
                />

                <path
                  d="M61 99 C82 126 97 139 110 150 C123 139 138 126 159 99"
                  fill="none"
                  stroke="rgba(255,255,255,0.32)"
                  strokeWidth="2"
                />
                <path
                  d="M61 201 C82 174 97 161 110 150 C123 161 138 174 159 201"
                  fill="none"
                  stroke="rgba(255,255,255,0.32)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="timer-readout">
              <div className="timer-big">{formatTimer(timerRemainingSeconds)}</div>
              <div className="muted">{timerTimeRemaining()}</div>
              <div className="timer-progress-label">
                {Math.round(clampedProgress * 100)}% remaining
              </div>
              <div className="timer-progress-strip" aria-hidden="true">
                <span style={{ width: `${clampedProgress * 100}%` }} />
              </div>
              <div className="timer-controls">
                <button type="button" className="timer-stop" onClick={stopTimer}>
                  Stop
                </button>
                <button type="button" className="timer-minimize" onClick={() => setTimerIsExpanded(false)}>
                  Minimize
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MiniTimer = () => (
    <div className="mini-timer">
      <div className="mini-timer-ring">
        <svg viewBox="0 0 60 60">
          <circle className="timer-ring-bg" cx="30" cy="30" r="24" />
          <circle
            className="timer-ring-progress"
            cx="30"
            cy="30"
            r="24"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerProgress)}`}
            style={{ stroke: timerProgressColor }}
          />
        </svg>
        <span>{formatTimer(timerRemainingSeconds)}</span>
      </div>
      <div className="mini-timer-info">
        <span className="muted">Timer Running</span>
        <strong>{formatTimer(timerRemainingSeconds)}</strong>
      </div>
      <div className="mini-timer-actions">
        <button type="button" onClick={() => setTimerIsExpanded(true)}>
          Expand
        </button>
        <button type="button" onClick={stopTimer}>
          Stop
        </button>
      </div>
    </div>
  );

  const TimesUpOverlay = () => (
    <div className="times-up-overlay">
      <div className="times-up-card">
        <div className="times-up-icon">⏰</div>
        <h2>TIME'S UP!</h2>
        <p>Timer has finished</p>
        <button type="button" onClick={dismissTimesUpAndReset}>
          Dismiss
        </button>
      </div>
    </div>
  );

  const AttendanceEntryRow = ({ entry, student, statusButtons }) => {
    const [noteValue, setNoteValue] = useState(entry.note || "");
    const statusColor =
      statusButtons.find((item) => item.value === entry.status)?.color || "#94a3b8";

    const StatusIcon = ({ kind }) => {
      if (kind === "present") {
        return (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4.5 10.2 8.2 13.8 15.5 6.5" />
          </svg>
        );
      }
      if (kind === "late") {
        return (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="6.2" />
            <path d="M10 6.6v3.8l2.6 1.6" />
          </svg>
        );
      }
      if (kind === "left-early") {
        return (
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M15.5 10H7.5" />
            <path d="m10.8 6.8-3.3 3.2 3.3 3.2" />
            <path d="M16.5 4.8v10.4" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5.4 5.4 14.6 14.6" />
          <path d="M14.6 5.4 5.4 14.6" />
        </svg>
      );
    };

    useEffect(() => {
      setNoteValue(entry.note || "");
    }, [entry.note]);

    return (
      <div className="attendance-student-card">
        <div className="attendance-student-row">
          <div className="attendance-student-info">
            <div
              className="attendance-avatar"
              style={{ background: `${statusColor}22`, color: statusColor }}
            >
              👤
            </div>
            <div>
              <div className="attendance-student-name">
                {student.first_name} {student.last_name}
              </div>
            </div>
          </div>
          <div className="attendance-status-buttons">
            {statusButtons.map((status) => (
              <button
                key={status.value}
                type="button"
                className={`status-btn ${
                  status.value === "Present"
                    ? "present"
                    : status.value === "Arrived late"
                      ? "late"
                      : status.value === "Left early"
                        ? "left-early"
                        : "absent"
                } ${entry.status === status.value ? "selected" : ""}`}
                style={
                  entry.status === status.value
                    ? { background: status.color, color: "#fff" }
                    : undefined
                }
                onClick={() => handleUpdateAttendanceEntry(entry.id, { status: status.value })}
                aria-label={status.value}
                title={status.value}
              >
                <span className="status-btn-icon">
                  <StatusIcon kind={status.kind} />
                </span>
                <span className="status-btn-text">{status.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {entry.status !== "Present" && (
          <div className="attendance-note">
            <span className="muted">Notes</span>
            <input
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              onBlur={() =>
                handleUpdateAttendanceEntry(entry.id, {
                  note: noteValue.trim() || null,
                })
              }
              placeholder="Add notes (optional)"
            />
          </div>
        )}
      </div>
    );
  };

  const AttendanceSessionDetailPage = () => {
    const { sessionId } = useParams();
    const session = attendanceSessions.find((item) => item.id === sessionId);
    const sessionEntries = attendanceEntries.filter((entry) => entry.session_id === sessionId);
    const sessionClass = classes.find((c) => c.id === session?.class_id);
    const sessionStudents = students
      .filter((student) => student.class_id === session?.class_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const entryMap = new Map(sessionEntries.map((entry) => [entry.student_id, entry]));
    const rows = sessionStudents.map((student) => ({
      student,
      entry: entryMap.get(student.id),
    }));

    const counts = {
      present: sessionEntries.filter((e) => e.status === "Present").length,
      absent: sessionEntries.filter((e) => e.status === "Didn't come").length,
      late: sessionEntries.filter((e) => e.status === "Arrived late").length,
      leftEarly: sessionEntries.filter((e) => e.status === "Left early").length,
    };

    const summaryRate = sessionEntries.length
      ? Math.round((counts.present / sessionEntries.length) * 100)
      : 0;

    const summaryColor =
      summaryRate >= 90 ? "#16a34a" : summaryRate >= 75 ? "#f59e0b" : "#ef4444";

    const statusButtons = [
      { value: "Present", shortLabel: "Present", kind: "present", color: "#16a34a" },
      { value: "Arrived late", shortLabel: "Late", kind: "late", color: "#f59e0b" },
      { value: "Left early", shortLabel: "Left early", kind: "left-early", color: "#eab308" },
      { value: "Didn't come", shortLabel: "Absent", kind: "absent", color: "#ef4444" },
    ];

    if (!session) {
      return (
        <section className="panel">
          <h2>Session not found</h2>
          <p className="muted">Select a session from Attendance.</p>
        </section>
      );
    }

    return (
      <section className="panel attendance-session">
        <div className="attendance-session-summary">
          <div className="attendance-summary-header">
            <div className="attendance-summary-icon">📆</div>
            <div>
              <div className="attendance-summary-title">
                {format(parseISO(session.session_date), "MMMM d, yyyy")}
              </div>
              <div className="muted">
                {sessionClass ? sessionClass.name : "Class"} • {sessionEntries.length} students
              </div>
            </div>
          </div>

          <div className="attendance-summary-stats">
            <div>
              <div className="muted">Present</div>
              <strong style={{ color: "#16a34a" }}>{counts.present}</strong>
            </div>
            <div>
              <div className="muted">Didn't come</div>
              <strong style={{ color: "#ef4444" }}>{counts.absent}</strong>
            </div>
            <div>
              <div className="muted">Late</div>
              <strong style={{ color: "#f59e0b" }}>{counts.late}</strong>
            </div>
            <div>
              <div className="muted">Left early</div>
              <strong style={{ color: "#eab308" }}>{counts.leftEarly}</strong>
            </div>
          </div>

          <div className="attendance-rate">
            <div className="muted">Attendance Rate</div>
            <div className="attendance-rate-bar">
              <span style={{ width: `${summaryRate}%`, background: summaryColor }} />
            </div>
            <div className="attendance-rate-value" style={{ color: summaryColor }}>
              {summaryRate}%
            </div>
          </div>
        </div>

        <div className="attendance-student-list">
          <h3>Mark Attendance</h3>
          {rows.map(({ student, entry }) =>
            entry ? (
              <AttendanceEntryRow
                key={entry.id}
                entry={entry}
                student={student}
                statusButtons={statusButtons}
              />
            ) : null
          )}
        </div>
      </section>
    );
  };

  const GroupsPage = () => {
    const [searchParams] = useSearchParams();
    const openSeparationsModal = () => {
      if (typeof window !== "undefined") {
        groupsScrollTopRef.current = window.scrollY;
      }
      setGroupsShowSeparations(true);
    };

    const closeSeparationsModal = () => {
      if (typeof window !== "undefined") {
        groupsScrollTopRef.current = window.scrollY;
      }
      setGroupsShowSeparations(false);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" });
          });
        });
      }
    };

    useEffect(() => {
      if (!groupsShowSeparations || typeof window === "undefined") return;
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" });
      });
    }, [groupsShowSeparations]);

    const classId = searchParams.get("classId") || "";

    useEffect(() => {
      if (classId && groupGenForm.classId != classId) {
        setGroupGenForm((prev) => ({ ...prev, classId }));
      }
    }, [classId]);

    const activeClassId = classId || groupGenForm.classId;
    const classStudents = activeClassId
      ? students.filter((student) => student.class_id === activeClassId)
      : [];
    const classStudentIdSet = new Set(classStudents.map((student) => student.id));
    const classConstraintList = activeClassId
      ? groupConstraints.filter(
          (constraint) =>
            classStudentIdSet.has(constraint.student_a) && classStudentIdSet.has(constraint.student_b)
        )
      : groupConstraints;
    const classGroups = activeClassId
      ? groups.filter((group) => group.class_id === activeClassId)
      : [];
    const classGroupMembers = classGroups.length
      ? groupMembers.filter((member) => classGroups.some((g) => g.id === member.group_id))
      : [];

    const grouped = classGroups.map((group) => {
      const memberIds = classGroupMembers
        .filter((m) => m.group_id === group.id)
        .map((m) => m.student_id);
      const members = classStudents.filter((student) => memberIds.includes(student.id));
      return { group, members };
    });

    const groupSize = Number(groupGenForm.size) || 4;
    const expectedGroupCount =
      classStudents.length > 0 ? Math.ceil(classStudents.length / groupSize) : 0;

    const genderIcon = (gender) => {
      const value = (gender || "").toLowerCase();
      if (value.includes("female")) return "♀";
      if (value.includes("male")) return "♂";
      if (value.includes("non")) return "⚧";
      return "•";
    };

    const genderColor = (gender) => {
      const value = (gender || "").toLowerCase();
      if (value.includes("female")) return "#ec4899";
      if (value.includes("male")) return "#3b82f6";
      if (value.includes("non")) return "#8b5cf6";
      return "#94a3b8";
    };

    const gradientForGroup = (index) => {
      const gradients = [
        ["#f1dfbe", "#e7d0a6"],
        ["#efe2c8", "#e4d3ad"],
        ["#ead7b4", "#e0c596"],
        ["#f0e3ca", "#e7d6b2"],
        ["#ebddc1", "#dfcaa3"],
        ["#f2e5cf", "#e7d7b7"],
      ];
      const pair = gradients[index % gradients.length];
      return `linear-gradient(90deg, ${pair[0]}, ${pair[1]})`;
    };

    return (
      <>
        {formError && <div className="error">{formError}</div>}
        <section className="panel groups-page">
          <div className="groups-header-card">
            <div className="groups-header-icon">👥</div>
            <h2>Smart Group Generator</h2>
            <p className="muted">Create balanced student groups with advanced options.</p>
            <div className="groups-header-info">
              <div>
                <span className="muted">Students</span>
                <strong>{classStudents.length || "—"}</strong>
              </div>
              <div>
                <span className="muted">Groups</span>
                <strong>{classGroups.length || "—"}</strong>
              </div>
            </div>
          </div>

          <div className="groups-controls-card">
            <div className="groups-controls-header">
              <h3>Group Settings</h3>
              {!classId && (
                <select
                  value={groupGenForm.classId}
                  onChange={(event) =>
                    setGroupGenForm((prev) => ({ ...prev, classId: event.target.value }))
                  }
                >
                  <option value="">Select class</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="groups-size-row">
              <div className="groups-size-display">
                <div className="muted">Students per group</div>
                <div className="groups-size-value">{groupSize}</div>
              </div>
              <div className="groups-size-controls">
                <button
                  type="button"
                  onClick={() =>
                    setGroupGenForm((prev) => ({
                      ...prev,
                      size: String(Math.max(2, groupSize - 1)),
                    }))
                  }
                  disabled={groupSize <= 2}
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGroupGenForm((prev) => ({
                      ...prev,
                      size: String(Math.min(10, groupSize + 1)),
                    }))
                  }
                  disabled={groupSize >= 10}
                >
                  +
                </button>
              </div>
            </div>

            {classStudents.length > 0 && (
              <div className="groups-info-row">
                This will create approximately {expectedGroupCount} groups.
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateGroups}
              className={`groups-generate-btn ${isGeneratingGroups ? "button-with-spinner" : ""}`}
              disabled={isGeneratingGroups}
              aria-busy={isGeneratingGroups}
            >
              {isGeneratingGroups && <span className="inline-spinner" aria-hidden="true" />}
              {classGroups.length ? "Regenerate Groups" : "Generate Groups"}
            </button>
          </div>

          <div className="groups-advanced-card">
            <div className="groups-advanced-header">
              <h3>Advanced Options</h3>
              <button type="button" className="link" onClick={() => setGroupsShowAdvanced((prev) => !prev)}>
                {groupsShowAdvanced ? "Hide" : "Show"}
              </button>
            </div>
            {groupsShowAdvanced && (
              <div className="groups-advanced-options">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={groupGenForm.balanceGender}
                    onChange={(event) =>
                      setGroupGenForm((prev) => ({ ...prev, balanceGender: event.target.checked }))
                    }
                  />
                  Balance Gender
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={groupGenForm.balanceAbility}
                    onChange={(event) =>
                      setGroupGenForm((prev) => ({ ...prev, balanceAbility: event.target.checked }))
                    }
                  />
                  Balance Academic Levels
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={groupGenForm.pairSupportPartners}
                    onChange={(event) =>
                      setGroupGenForm((prev) => ({ ...prev, pairSupportPartners: event.target.checked }))
                    }
                  />
                  Pair Learning Partners
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={groupGenForm.respectSeparations}
                    onChange={(event) =>
                      setGroupGenForm((prev) => ({
                        ...prev,
                        respectSeparations: event.target.checked,
                      }))
                    }
                  />
                  Respect Separation Rules
                </label>
                <button type="button" className="link" onClick={openSeparationsModal}>
                  Separations
                </button>
                <p className="muted groups-option-help">
                  Academic levels are estimated from recent gradebook scores for this class.
                </p>
              </div>
            )}
          </div>

          {grouped.length === 0 ? (
            <div className="groups-empty">
              <div className="groups-empty-icon">✨</div>
              <div className="groups-empty-title">No groups yet</div>
              <div className="muted">Configure your settings and click Generate Groups.</div>
            </div>
          ) : (
            <div className="groups-results">
              <div className="groups-results-header">
                <h3>Generated Groups</h3>
              </div>
              <div className="groups-grid">
                {grouped.map(({ group, members }, index) => (
                  <div key={group.id} className="group-card">
                    <div className="group-card-header" style={{ background: gradientForGroup(index) }}>
                      <span>Group {index + 1}</span>
                      <span className="group-card-count">{members.length}</span>
                    </div>
                    <div className="group-card-body">
                      {members.map((student) => (
                        <div key={student.id} className="group-student">
                          <span style={{ color: genderColor(student.gender) }}>
                            {genderIcon(student.gender)}
                          </span>
                          <span>
                            {student.first_name} {student.last_name}
                          </span>
                          {student.needs_help && <span className="group-need">✋</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {groupsShowSeparations && (
          <div className="modal-overlay">
            <div className="modal-card separations-modal">
              <h3>Separation Rules</h3>
              <div className="grid">
                <label className="stack">
                  <span>Student A</span>
                  <select
                    value={constraintForm.studentA}
                    onChange={(event) =>
                      setConstraintForm((prev) => ({ ...prev, studentA: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select student</option>
                    {classStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="stack">
                  <span>Student B</span>
                  <select
                    value={constraintForm.studentB}
                    onChange={(event) =>
                      setConstraintForm((prev) => ({ ...prev, studentB: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select student</option>
                    {classStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="separations-add-btn" onClick={handleAddConstraint}>
                  Add separation
                </button>
              </div>
              {classConstraintList.length > 0 && (
                <ul className="list">
                  {classConstraintList.map((constraint) => {
                    const studentA = students.find((item) => item.id === constraint.student_a);
                    const studentB = students.find((item) => item.id === constraint.student_b);
                    return (
                      <li key={constraint.id}>
                        <div className="list-row">
                          <span>
                            {studentA ? `${studentA.first_name} ${studentA.last_name}` : "Student"}
                            {" ↔ "}
                            {studentB ? `${studentB.first_name} ${studentB.last_name}` : "Student"}
                          </span>
                          <button
                            type="button"
                            className="link danger separation-delete-btn"
                            onClick={() => handleDeleteConstraint(constraint.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="modal-actions separations-actions">
                <button type="button" className="secondary" onClick={closeSeparationsModal}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const DashboardPage = () => {
    return (
      <>
        <section className="panel quick-actions-panel">
          <div className="tile-grid">
            {tiles.map((tile) => (
              <NavLink
                key={tile.label}
                to={tile.path}
                className="tile"
                style={{
                  "--tile-accent": tile.accent,
                  "--tile-accent-soft": `${tile.accent}26`,
                  "--icon-tilt": `${tile.iconTilt}deg`,
                  "--icon-offset-x": `${tile.iconX}px`,
                  "--icon-offset-y": `${tile.iconY}px`,
                  "--icon-stroke": tile.iconStroke,
                  "--icon-wobble-ms": `${tile.wobbleMs}ms`,
                }}
              >
                <span className="tile-circle" aria-hidden="true">
                  <TileIcon kind={tile.icon} />
                </span>
                <span className="tile-label">{tile.label}</span>
                <span className="tile-scratch" aria-hidden="true" />
              </NavLink>
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <BrowserRouter>
      <Layout
        user={user}
        onSignOut={onSignOut}
        preferences={profilePreferences}
        calendarEvents={calendarEvents}
      >
        <Routes>
          <Route
            path="/"
            element={
              profilePreferences.defaultLandingPath &&
              profilePreferences.defaultLandingPath !== "/"
                ? <Navigate to={profilePreferences.defaultLandingPath} replace />
                : <DashboardPage />
            }
          />
          <Route
            path="/classes"
            element={
              <ClassesPage
                formError={formError}
                classForm={classForm}
                setClassForm={setClassForm}
                handleCreateClass={handleCreateClass}
                handleDeleteClass={handleDeleteClass}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                classes={classes}
                students={students}
                subjects={subjects}
                classOptions={classOptions}
                loading={loading}
              />
            }
          />
          <Route
            path="/classes/:classId"
            element={
              <ClassDetailPage
                formError={formError}
                classes={classes}
                subjects={subjects}
                students={students}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                developmentScores={developmentScores}
                subjectForm={subjectForm}
                setSubjectForm={setSubjectForm}
                handleCreateSubject={handleCreateSubject}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                handleCreateStudent={handleCreateStudent}
                useReorderModeHook={useReorderMode}
                useHandleDragHook={useHandleDrag}
                ReorderModeToggleComponent={ReorderModeToggle}
                studentGenderOptions={STUDENT_GENDER_OPTIONS}
              />
            }
          />
          <Route
            path="/attendance"
            element={
              <AttendancePage
                classOptions={classOptions}
                students={students}
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                formError={formError}
                setFormError={setFormError}
                loadData={loadData}
              />
            }
          />
          <Route path="/attendance/:sessionId" element={<AttendanceSessionDetailPage />} />
          <Route
            path="/assessments"
            element={
              <AssessmentsPage
                formError={formError}
                loading={loading}
                classes={classes}
                subjects={subjects}
                units={units}
                students={students}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
              />
            }
          />
          <Route
            path="/assessments/:assessmentId"
            element={
              <AssessmentDetailPage
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                classes={classes}
                subjects={subjects}
                units={units}
                students={students}
                handleUpdateAssessmentEntry={handleUpdateAssessmentEntry}
                setAssessments={setAssessments}
                setFormError={setFormError}
                loadData={loadData}
              />
            }
          />
          <Route path="/groups" element={<GroupsPage />} />
          <Route
            path="/random"
            element={<RandomPickerPage formError={formError} classOptions={classOptions} students={students} />}
          />
          <Route
            path="/rubrics"
            element={
              <RubricsPage
                formError={formError}
                rubrics={rubrics}
                rubricCategories={rubricCategories}
                rubricCriteria={rubricCriteria}
                loading={loading}
                seedingRubrics={seedingRubrics}
                handleSeedDefaultRubrics={handleSeedDefaultRubrics}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                loadData={loadData}
              />
            }
          />
          <Route
            path="/timer"
            element={<TimerPage />}
          />
          <Route
            path="/subjects/:subjectId"
            element={
              <SubjectDetailPage
                formError={formError}
                subjects={subjects}
                units={units}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                unitForm={unitForm}
                setUnitForm={setUnitForm}
                handleCreateUnit={handleCreateUnit}
                handleSwapSortOrder={handleSwapSortOrder}
                handleDeleteUnit={handleDeleteUnit}
              />
            }
          />
          <Route
            path="/units/:unitId"
            element={
              <UnitDetailPage
                formError={formError}
                units={units}
                subjects={subjects}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                handleCreateAssessmentForUnit={handleCreateAssessmentForUnit}
                handleSwapSortOrder={handleSwapSortOrder}
                handleDeleteAssessment={handleDeleteAssessment}
                handleCopyAssessmentsFromUnit={handleCopyAssessmentsFromUnit}
              />
            }
          />
          <Route
            path="/running-records"
            element={
              <RunningRecordsPage
                formError={formError}
                handleCreateRunningRecord={handleCreateRunningRecord}
                handleDeleteRunningRecord={handleDeleteRunningRecord}
                runningRecordForm={runningRecordForm}
                setRunningRecordForm={setRunningRecordForm}
                students={students}
                classes={classes}
                loading={loading}
                runningRecords={runningRecords}
              />
            }
          />
          <Route
            path="/students/:studentId"
            element={
              <StudentDetailPage
                students={students}
                classes={classes}
                subjects={subjects}
                assessments={assessments}
                attendanceEntries={attendanceEntries}
                runningRecords={runningRecords}
                assessmentEntries={assessmentEntries}
                rubricCriteria={rubricCriteria}
                rubricCategories={rubricCategories}
                rubrics={rubrics}
                developmentScores={developmentScores}
                developmentScoreForm={developmentScoreForm}
                setDevelopmentScoreForm={setDevelopmentScoreForm}
                handleCreateDevelopmentScore={handleCreateDevelopmentScore}
                handleCreateDevelopmentScoreEntry={handleCreateDevelopmentScoreEntry}
                handleUpdateDevelopmentScore={handleUpdateDevelopmentScore}
                handleUpdateStudent={handleUpdateStudent}
                formError={formError}
              />
            }
          />
          <Route
            path="/calendar"
            element={
              <CalendarPage
                formError={formError}
                setFormError={setFormError}
                loadData={loadData}
                classOptions={classOptions}
                calendarDiaryEntries={calendarDiaryEntries}
                calendarEvents={calendarEvents}
                calendarTablesReady={calendarTablesReady}
                classes={classes}
                subjects={subjects}
                units={units}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                user={user}
                preferences={profilePreferences}
                onPreferencesChange={setProfilePreferences}
              />
            }
          />
        </Routes>
        {timerIsRunning && timerIsExpanded && <TimerOverlay />}
        {timerIsRunning && !timerIsExpanded && <MiniTimer />}
        {timerShowTimesUp && <TimesUpOverlay />}
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) setUser(data.session?.user ?? null);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="page">
      {statusMessage && <div className="status">{statusMessage}</div>}
      {user ? (
        <TeacherWorkspace user={user} onSignOut={handleSignOut} />
      ) : (
        <AuthForm onSuccess={setStatusMessage} />
      )}
    </div>
  );
}

export default App;
