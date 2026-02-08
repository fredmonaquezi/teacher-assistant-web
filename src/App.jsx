import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  format,
  parseISO,
} from "date-fns";
import { BrowserRouter, NavLink, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import ClassDetailPage from "./pages/ClassDetailPage";
import AttendancePage from "./pages/AttendancePage";
import AssessmentDetailPage from "./pages/AssessmentDetailPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import CalendarPage from "./pages/CalendarPage";
import RandomPickerPage from "./pages/RandomPickerPage";
import RunningRecordsPage from "./pages/RunningRecordsPage";
import { supabase } from "./supabaseClient";
import "./App.css";
import "react-day-picker/dist/style.css";

const STUDENT_GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const ATTENDANCE_STATUS_OPTIONS = [
  "Present",
  "Didn't come",
  "Arrived late",
  "Left early",
];

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
  const subjectIcon = (subject) => {
    const normalized = normalizeSubject(subject);
    if (["english", "inglês", "ingles"].includes(normalized)) return "📘";
    if (["math", "mathematics", "matemática", "matematica"].includes(normalized)) return "➗";
    if (["science", "ciência", "ciencia", "ciências", "ciencias"].includes(normalized)) return "🧪";
    if (["general", "geral"].includes(normalized)) return "⭐";
    return "📄";
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
          <div className="rubrics-header-icon">📄</div>
          <h2>Rubric Template Library</h2>
          <p className="muted">
            Browse, customize, and create development tracking templates.
          </p>
        </div>

        <div className="rubrics-actions">
          <button type="button" onClick={() => setShowCreateTemplate(true)}>
            Create New
          </button>
          <button type="button" onClick={handleSeedDefaultRubrics} disabled={seedingRubrics}>
            {seedingRubrics ? "Seeding default rubrics..." : "Create default rubrics"}
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading rubrics...</p>
        ) : (
          gradeLevels.map((level) => {
            const templates = templatesForLevel(level);
            if (!templates.length) return null;
            return (
              <div key={level} className="rubrics-section">
                <div className="rubrics-section-title">
                  <span>🎓</span>
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
                          {subjectIcon(template.subject)}
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
              <div
                className="rubrics-editor-icon"
                style={{ color: subjectColor(selectedTemplate.subject) }}
              >
                {subjectIcon(selectedTemplate.subject)}
              </div>
              <div>
                <div className="rubrics-editor-subject" style={{ color: subjectColor(selectedTemplate.subject) }}>
                  {selectedTemplate.subject || "Subject"}
                </div>
                <div className="rubrics-editor-title">{selectedTemplate.title}</div>
                <div className="muted">{selectedTemplate.grade_band || "Grade band"}</div>
              </div>
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

            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setSelectedTemplate(null)}>
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
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onClassHandlePointerDown,
    onHandlePointerMove: onClassHandlePointerMove,
    onHandlePointerUp: onClassHandlePointerUp,
    isDragAllowed: isClassDragAllowed,
    resetHandleDrag: resetClassHandleDrag,
  } = useHandleDrag(isReorderEnabled);

  const classHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel classes-page">
        <div className="classes-header">
          <h2>Classes</h2>
          <div className="classes-header-actions">
            {isMobileLayout && classes.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button type="button" onClick={() => setShowAddClass(true)}>
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
                  draggable={isReorderEnabled}
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
                  <div className="class-card-header">
                    <NavLink to={`/classes/${item.id}`} className="class-card-title">
                      {item.name}
                    </NavLink>
                    <div className="class-card-actions">
                      <button
                        type="button"
                        className={classHandleClassName}
                        aria-label={`Drag ${item.name}`}
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
                        onClick={() => handleDeleteClass(item.id)}
                        aria-label={`Delete ${item.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="class-card-subtitle">
                    {item.grade_level || "—"}
                    {item.school_year ? ` • ${item.school_year}` : ""}
                  </div>
                  <div className="class-card-meta">
                    <span>{studentCount} students</span>
                    <span>{subjectCount} subjects</span>
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
  const subjectResults = assessmentEntries.filter(
    (entry) =>
      subjectAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const subjectAverage = subjectResults.length
    ? subjectResults.reduce((sum, item) => sum + Number(item.score), 0) / subjectResults.length
    : 0;
  const averageColor = subjectAverage >= 7 ? "#16a34a" : subjectAverage >= 5 ? "#ea580c" : "#dc2626";
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
          <p style={{ color: averageColor }}>{subjectAverage.toFixed(1)}</p>
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
        <p className="muted">Use the ⠿ handle to reorder units. On mobile, turn on Reorder Mode first.</p>
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
                draggable={isReorderEnabled}
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
                  <NavLink to={`/units/${unit.id}`} className="subject-unit-name">
                    {unit.name}
                  </NavLink>
                  <p className="muted">{unit.description || "No description"}</p>
                </div>
                <div className="subject-unit-actions">
                  <button
                    type="button"
                    className={unitHandleClassName}
                    aria-label={`Drag ${unit.name}`}
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
                    onClick={() => {
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
          <div className="modal-card">
            <h3>Add New Unit</h3>
            <p className="muted">Give your unit a name.</p>
            <form
              className="grid"
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
                  placeholder="Optional"
                />
              </label>
              {!!unitForm.name.trim() && (
                <div className="subject-unit-preview">
                  <strong>Preview</strong>
                  <p>{unitForm.name}</p>
                </div>
              )}
              <div className="modal-actions">
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
  const gradedEntries = assessmentEntries.filter(
    (entry) =>
      unitAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const unitAverage = gradedEntries.length
    ? gradedEntries.reduce((sum, entry) => sum + Number(entry.score), 0) / gradedEntries.length
    : 0;
  const averageColor = unitAverage >= 7 ? "#16a34a" : unitAverage >= 5 ? "#ea580c" : "#dc2626";
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
      <section className="panel unit-detail-header">
        <h2>{unit.name}</h2>
        <p className="muted">
          {subject ? `Subject: ${subject.name}` : ""} {unit.description ? `• ${unit.description}` : ""}
        </p>
      </section>

      <section className="unit-stat-row">
        <article className="panel unit-stat-card">
          <p className="muted">Unit Average</p>
          <p style={{ color: averageColor }}>{unitAverage.toFixed(1)}</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Assessments</p>
          <p style={{ color: "#2563eb" }}>{unitAssessments.length}</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Total Grades</p>
          <p style={{ color: "#7c3aed" }}>{gradedEntries.length}</p>
        </article>
      </section>

      <section className="panel">
        <h3>Quick Actions</h3>
        <div className="unit-actions-grid">
          <NavLink to="/assessments" className="unit-action-card action-green">
            <strong>Gradebook</strong>
            <span>View all grades</span>
          </NavLink>
          <button type="button" className="unit-action-card action-purple" disabled>
            <strong>Library</strong>
            <span>Disabled for now</span>
          </button>
        </div>
        <button
          type="button"
          className="unit-copy-button"
          onClick={() => {
            setCopySourceSubjectId("");
            setCopySourceUnitId("");
            setCopyStep("subject");
            setShowCopyCriteriaFlow(true);
          }}
        >
          <div>
            <strong>Copy Criteria</strong>
            <span>Import assessments from another unit</span>
          </div>
          <span>›</span>
        </button>
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
        <p className="muted">Use the ⠿ handle to reorder assessments. On mobile, turn on Reorder Mode first.</p>
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
                draggable={isReorderEnabled}
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
                  <NavLink to={`/assessments/${item.id}`} className="unit-assessment-name">
                    {item.title}
                  </NavLink>
                  <p className="muted">
                    {item.assessment_date || "No date"} {item.max_score ? `• ${item.max_score} pts` : ""}
                  </p>
                </div>
                <div className="unit-assessment-actions">
                  <button
                    type="button"
                    className={assessmentHandleClassName}
                    aria-label={`Drag ${item.title}`}
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
                    onClick={() => {
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
          <div className="modal-card">
            <h3>Add New Assessment</h3>
            <p className="muted">Give your assessment a name.</p>
            <form
              className="grid"
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
              <div className="modal-actions">
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
            <div className="modal-card">
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
  developmentScores,
  developmentScoreForm,
  setDevelopmentScoreForm,
  handleCreateDevelopmentScore,
  handleUpdateStudent,
  formError,
}) {
  const { studentId } = useParams();
  const student = students.find((item) => item.id === studentId);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showDevelopmentForm, setShowDevelopmentForm] = useState(false);
  const [editForm, setEditForm] = useState({
    gender: "Prefer not to say",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
    separationList: "",
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
  const overallAverage = scoredAssessments.length
    ? scoredAssessments.reduce((sum, entry) => sum + Number(entry.score), 0) / scoredAssessments.length
    : 0;
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
    const average = subjectScores.length
      ? subjectScores.reduce((sum, item) => sum + Number(item.score), 0) / subjectScores.length
      : 0;
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
    if (value >= 7) return "#16a34a";
    if (value >= 5) return "#ea580c";
    return "#dc2626";
  };

  const toggleStatus = async (field) => {
    if (!student) return;
    const next = {
      gender: student.gender || "Prefer not to say",
      notes: student.notes || "",
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
      separationList: student.separation_list || "",
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

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel student-profile-header">
        <div>
          <h2>
            {student.first_name} {student.last_name}
          </h2>
          <p className="muted">{classItem ? `${classItem.name}${classItem.grade_level ? ` (${classItem.grade_level})` : ""}` : "No class"}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditForm({
              gender: student.gender || "Prefer not to say",
              notes: student.notes || "",
              isParticipatingWell: !!student.is_participating_well,
              needsHelp: !!student.needs_help,
              missingHomework: !!student.missing_homework,
              separationList: student.separation_list || "",
            });
            setShowEditInfo(true);
          }}
        >
          Edit Info
        </button>
      </section>

      <section className="panel">
        <h3>Quick Status</h3>
        <div className="student-status-grid">
          <button
            type="button"
            className={`student-status-card ${student.is_participating_well ? "active green" : ""}`}
            onClick={() => toggleStatus("isParticipatingWell")}
          >
            <span>⭐</span>
            <div>
              <strong>Participating Well</strong>
              <p>{student.is_participating_well ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card ${student.needs_help ? "active orange" : ""}`}
            onClick={() => toggleStatus("needsHelp")}
          >
            <span>⚠️</span>
            <div>
              <strong>Needs Help</strong>
              <p>{student.needs_help ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card ${student.missing_homework ? "active red" : ""}`}
            onClick={() => toggleStatus("missingHomework")}
          >
            <span>📚</span>
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
          <p style={{ color: averageColor(overallAverage) }}>{overallAverage.toFixed(1)}</p>
        </article>
        <article className="panel student-stat-card">
          <p className="muted">Total Assessments</p>
          <p style={{ color: "#2563eb" }}>{assessmentsForStudent.length}</p>
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
          <NavLink to="/running-records">View All</NavLink>
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
                <p style={{ color: averageColor(item.average) }}>{item.average.toFixed(1)}</p>
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
              return (
                <li key={entry.id}>
                  <span>
                    {assessment?.title || "Assessment"}
                    {subjectName ? ` · ${subjectName}` : ""}
                    {assessment?.assessment_date ? ` · ${assessment.assessment_date}` : ""}
                  </span>
                  {entry.score !== null && Number.isFinite(Number(entry.score)) ? (
                    <strong style={{ color: averageColor(Number(entry.score || 0)) }}>
                      {Number(entry.score).toFixed(1)}
                    </strong>
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
                      return (
                        <li key={score.id}>
                          <span>{criterion?.label || "Criterion"}</span>
                          <span>
                            {"★".repeat(Math.max(0, Number(score.rating || 0)))}
                            {"☆".repeat(Math.max(0, 5 - Number(score.rating || 0)))}
                            {" "}
                            {ratingLabel(Number(score.rating || 0))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        )}
      </section>

      {showDevelopmentForm && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Update Development Tracking</h3>
            <form
              onSubmit={async (event) => {
                await handleCreateDevelopmentScore(event, studentId);
                setShowDevelopmentForm(false);
              }}
              className="grid"
            >
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
                  {rubricCriteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.id}>
                      {criterion.label || criterion.description}
                    </option>
                  ))}
                </select>
              </label>
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
              <div className="modal-actions">
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
          <div className="modal-card">
            <h3>Edit Student</h3>
            <form
              className="grid"
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
                />
              </label>
              <label className="stack">
                <span>Separation list</span>
                <input
                  value={editForm.separationList}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, separationList: event.target.value }))
                  }
                  placeholder="comma-separated student IDs"
                />
              </label>
              <div className="modal-actions">
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
    <div className="card">
      <h1>Teacher Assistant</h1>
      <p className="muted">Sign in to sync your data across devices.</p>

      <form onSubmit={handleSubmit} className="stack">
        <label className="stack">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="stack">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}

function Layout({ userEmail, onSignOut, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1 className="brand">Teacher Assistant</h1>
          <p className="muted">Signed in as {userEmail}</p>
        </div>
        <div className="topbar-actions">
          <nav className="nav-links">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/classes">Classes</NavLink>
            <NavLink to="/attendance">Attendance</NavLink>
            <NavLink to="/assessments">Gradebook</NavLink>
            <NavLink to="/groups">Groups</NavLink>
          </nav>
          <button type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

function TeacherWorkspace({ user, onSignOut }) {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [_lessonPlans, setLessonPlans] = useState([]);
  const [calendarDiaryEntries, setCalendarDiaryEntries] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
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
    respectSeparations: true,
  });
  const [constraintForm, setConstraintForm] = useState({
    studentA: "",
    studentB: "",
  });

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

      if (diaryError && !isMissingTableError(diaryError)) {
        setFormError(diaryError.message);
      } else {
        setCalendarDiaryEntries(diaryRows ?? []);
      }

      if (eventError && !isMissingTableError(eventError)) {
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
      return;
    }

    const { data: insertedStudent, error } = await supabase
      .from("students")
      .insert(payload)
      .select("id,class_id")
      .single();
    if (error || !insertedStudent?.id) {
      setFormError(error?.message || "Failed to create student.");
      return;
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
      separation_list: updates.separationList?.trim() || null,
    };

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
    const payload = {
      title: assessmentForm.title.trim(),
      subject: assessmentForm.subject.trim() || null,
      assessment_date: assessmentForm.assessmentDate || null,
      class_id: assessmentForm.classId || null,
      max_score: assessmentForm.maxScore ? Number(assessmentForm.maxScore) : null,
      notes: assessmentForm.notes.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.title) {
      setFormError("Assessment title is required.");
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

    const { error } = await supabase.from("assessment_entries").insert(payload);
    if (error) {
      setFormError(error.message);
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
    const maxScore = maxScoreRaw ? Number(maxScoreRaw) : null;
    const inferredSortOrder =
      assessments
        .filter((item) => item.unit_id === unitId)
        .reduce((maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)), -1) + 1;

    if (!title) {
      setFormError("Assessment title is required.");
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

        const { error: entriesError } = await supabase.from("assessment_entries").insert(entryRows);
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

        const { error: entriesError } = await supabase.from("assessment_entries").insert(entryRows);
        if (entriesError) {
          setFormError(`Assessments copied, but assigning students failed: ${entriesError.message}`);
        }
      }
    }

    await loadData();
  };

  const handleCreateDevelopmentScore = async (event, studentIdOverride) => {
    event.preventDefault();
    setFormError("");

    const payload = {
      student_id: studentIdOverride || developmentScoreForm.studentId,
      criterion_id: developmentScoreForm.criterionId,
      rating: Number(developmentScoreForm.rating),
      score_date: developmentScoreForm.date || null,
      notes: developmentScoreForm.notes.trim() || null,
    };

    if (!payload.student_id || !payload.criterion_id) {
      setFormError("Select a student and a rubric criterion.");
      return;
    }
    if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return;
    }

    const { error } = await supabase.from("development_scores").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setDevelopmentScoreForm({
      studentId: "",
      criterionId: "",
      rating: "3",
      date: "",
      notes: "",
    });
    await loadData();
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

  const pickBestStudent = (candidates, group, constraintSet, options) => {
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

    if (options.balanceAbility && group.length > 0) {
      const hasNeedsHelp = group.some((s) => s.needs_help);
      if (hasNeedsHelp) {
        const candidate = filtered.find((s) => !s.needs_help);
        if (candidate) return candidate;
      } else {
        const candidate = filtered.find((s) => s.needs_help);
        if (candidate) return candidate;
      }
    }

    return filtered[0];
  };

  const generateGroups = (studentList, groupSize, constraintSet, options, maxAttempts = 200) => {
    if (studentList.length === 0) return [];
    const size = Math.max(2, groupSize);
    let available = [...studentList];

    if (options.balanceAbility) {
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
        const candidate = pickBestStudent(available, group, constraintSet, options);
        if (!candidate) break;
        group.push(candidate);
        available = available.filter((s) => s.id !== candidate.id);
      }

      if (group.length > 0) groupsDraft.push(group);
    }

    return groupsDraft;
  };

  const handleGenerateGroups = async () => {
    setFormError("");
    setRandomResult("");

    const classId = groupGenForm.classId;
    const size = Number(groupGenForm.size);
    const prefix = groupGenForm.prefix.trim() || "Group";
    const clearExisting = groupGenForm.clearExisting;
    const balanceGender = groupGenForm.balanceGender;
    const balanceAbility = groupGenForm.balanceAbility;
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
    const groupList = generateGroups(
      classStudents,
      size,
      constraintSet,
      { balanceGender, balanceAbility, respectSeparations }
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

  const stopTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopTimerSound = () => {
    if (timerAudioRef.current) {
      timerAudioRef.current.pause();
      timerAudioRef.current.currentTime = 0;
      timerAudioRef.current = null;
    }
  };

  const playTimerSound = () => {
    try {
      const audio = new Audio("/timer_end.wav");
      audio.loop = true;
      audio.play().catch(() => {});
      timerAudioRef.current = audio;
    } catch {
      console.warn("Timer sound failed to play.");
    }
  };

  const resetTimer = () => {
    stopTimerSound();
    stopTimerInterval();
    setTimerShowTimesUp(false);
    setTimerIsRunning(false);
    setTimerIsExpanded(false);
    setTimerTotalSeconds(0);
    setTimerRemainingSeconds(0);
  };

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
  }, [timerIsRunning]);

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
    { label: "Classes", path: "/classes", color: "#2563eb", desc: "Students & lesson plans" },
    { label: "Attendance", path: "/attendance", color: "#16a34a", desc: "Track presence" },
    { label: "Gradebook", path: "/assessments", color: "#ea580c", desc: "Assessments" },
    { label: "Rubrics", path: "/rubrics", color: "#7c3aed", desc: "Build rubrics" },
    { label: "Groups", path: "/groups", color: "#a855f7", desc: "Generate groups" },
    { label: "Random Picker", path: "/random", color: "#ef4444", desc: "Pick a student" },
    { label: "Timer", path: "/timer", color: "#dc2626", desc: "Class timer" },
    { label: "Running Records", path: "/running-records", color: "#0284c7", desc: "Reading checks" },
    { label: "Calendar", path: "/calendar", color: "#0f766e", desc: "Plan dates" },
  ];

  const PlaceholderPage = ({ title, message }) => (
    <section className="panel">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
    </section>
  );

  const TimerPage = () => {
    const [customMinutes, setCustomMinutes] = useState(5);
    const [customSeconds, setCustomSeconds] = useState(0);

    const totalCustomSeconds = customMinutes * 60 + customSeconds;

    return (
      <section className="panel timer-page">
        <div className="timer-header-card">
          <div className="timer-icon">⏱️</div>
          <h2>Classroom Timer</h2>
          <p className="muted">Choose a duration to start the countdown.</p>
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

  const TimerOverlay = () => (
    <div className="timer-overlay">
      <div className="timer-overlay-card">
        <div className="timer-ring">
          <svg viewBox="0 0 120 120">
            <circle className="timer-ring-bg" cx="60" cy="60" r="52" />
            <circle
              className="timer-ring-progress"
              cx="60"
              cy="60"
              r="52"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - timerProgress)}`}
              style={{ stroke: timerProgressColor }}
            />
          </svg>
          <div className="timer-ring-text">
            <div className="timer-big">{formatTimer(timerRemainingSeconds)}</div>
            <div className="muted">{timerTimeRemaining()}</div>
          </div>
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
  );

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
                className={`status-btn ${entry.status === status.value ? "selected" : ""}`}
                style={
                  entry.status === status.value
                    ? { background: status.color, color: "#fff" }
                    : undefined
                }
                onClick={() => handleUpdateAttendanceEntry(entry.id, { status: status.value })}
              >
                {status.icon}
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
      { value: "Present", icon: "✓", color: "#16a34a" },
      { value: "Arrived late", icon: "⏰", color: "#f59e0b" },
      { value: "Left early", icon: "↪", color: "#eab308" },
      { value: "Didn't come", icon: "✕", color: "#ef4444" },
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
    const classId = searchParams.get("classId") || "";
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [showSeparations, setShowSeparations] = useState(false);

    useEffect(() => {
      if (classId && groupGenForm.classId != classId) {
        setGroupGenForm((prev) => ({ ...prev, classId }));
      }
    }, [classId]);

    const activeClassId = classId || groupGenForm.classId;
    const classStudents = activeClassId
      ? students.filter((student) => student.class_id === activeClassId)
      : [];
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
        ["#a855f7", "#3b82f6"],
        ["#3b82f6", "#22d3ee"],
        ["#22c55e", "#86efac"],
        ["#fb923c", "#fde047"],
        ["#ec4899", "#a855f7"],
        ["#ef4444", "#f97316"],
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
              <div>
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

            <button type="button" onClick={handleGenerateGroups} className="groups-generate-btn">
              {classGroups.length ? "Regenerate Groups" : "Generate Groups"}
            </button>
          </div>

          <div className="groups-advanced-card">
            <div className="groups-advanced-header">
              <h3>Advanced Options</h3>
              <button type="button" className="link" onClick={() => setShowAdvanced((prev) => !prev)}>
                {showAdvanced ? "Hide" : "Show"}
              </button>
            </div>
            {showAdvanced && (
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
                  Balance Ability Levels
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
                <button type="button" className="link" onClick={() => setShowSeparations(true)}>
                  Separations
                </button>
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

        {showSeparations && (
          <div className="modal-overlay">
            <div className="modal-card">
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
                <button type="button" onClick={handleAddConstraint}>
                  Add separation
                </button>
              </div>
              {groupConstraints.length > 0 && (
                <ul className="list">
                  {groupConstraints.map((constraint) => {
                    const studentA = students.find((item) => item.id === constraint.student_a);
                    const studentB = students.find((item) => item.id === constraint.student_b);
                    return (
                      <li key={constraint.id}>
                        {studentA ? `${studentA.first_name} ${studentA.last_name}` : "Student"}
                        {" ↔ "}
                        {studentB ? `${studentB.first_name} ${studentB.last_name}` : "Student"}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="modal-actions">
                <button type="button" className="link" onClick={() => setShowSeparations(false)}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const DashboardPage = () => (
    <section className="panel">
      <h2>Dashboard</h2>
      <p className="muted">Pick a tool to get started.</p>
      <div className="tile-grid">
        {tiles.map((tile) => (
          <NavLink
            key={tile.label}
            to={tile.path}
            className="tile"
            style={{ background: tile.color }}
          >
            <span className="tile-label">{tile.label}</span>
            <span className="tile-desc">{tile.desc}</span>
          </NavLink>
        ))}
      </div>
    </section>
  );

  return (
    <BrowserRouter>
      <Layout userEmail={user.email} onSignOut={onSignOut}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
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
                handleCreateAssessment={handleCreateAssessment}
                assessmentForm={assessmentForm}
                setAssessmentForm={setAssessmentForm}
                classOptions={classOptions}
                loading={loading}
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
                developmentScores={developmentScores}
                developmentScoreForm={developmentScoreForm}
                setDevelopmentScoreForm={setDevelopmentScoreForm}
                handleCreateDevelopmentScore={handleCreateDevelopmentScore}
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
                classes={classes}
                subjects={subjects}
                units={units}
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
