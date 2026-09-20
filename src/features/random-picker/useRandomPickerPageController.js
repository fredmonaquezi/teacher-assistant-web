import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_CATEGORIES,
  getCategoryColor,
  getCategoryIcon,
  normalizeUsedStudentIds,
  sameScope,
} from "./randomPickerPageModel";

export default function useRandomPickerPageController({
  t,
  language,
  loading,
  classOptions,
  activeClassId,
  students,
  randomPickerCustomCategories,
  randomPickerRotationRows,
  handleCreateRandomPickerCustomCategory,
  handleDeleteRandomPickerCustomCategory,
  handleSetRandomPickerRotationUsedStudents,
  handleImportLegacyRandomPickerState,
}) {
  const classId = activeClassId;
  const [selectedCategory, setSelectedCategory] = useState("Helper");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRotationMode, setIsRotationMode] = useState(false);
  const [rotationFeedback, setRotationFeedback] = useState("");
  const didImportLegacyRef = useRef(false);
  const classLabel = classOptions.find((option) => option.id === classId)?.label;
  const validClassIds = useMemo(
    () => new Set(classOptions.map((option) => option.id).filter(Boolean)),
    [classOptions]
  );
  const filteredStudents = useMemo(
    () => students.filter((student) =>
      Boolean(classId) && validClassIds.has(student.class_id) && student.class_id === classId
    ),
    [classId, students, validClassIds]
  );
  const customCategories = useMemo(() => {
    if (!classId) return [];
    return randomPickerCustomCategories
      .filter((item) => sameScope(item.class_id, classId))
      .sort((first, second) => {
        const sortDifference = Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0);
        return sortDifference || String(first.created_at || "").localeCompare(String(second.created_at || ""));
      })
      .map((item) => item.name)
      .filter(Boolean);
  }, [classId, randomPickerCustomCategories]);
  const categories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);
  const activeCategory = categories.includes(selectedCategory) ? selectedCategory : "Helper";
  const selectedRotationRow = useMemo(
    () => classId
      ? randomPickerRotationRows.find((item) =>
          sameScope(item.class_id, classId) && String(item.category || "") === activeCategory
        ) || null
      : null,
    [activeCategory, classId, randomPickerRotationRows]
  );
  const usedStudentIds = useMemo(
    () => new Set(normalizeUsedStudentIds(selectedRotationRow?.used_student_ids || [])),
    [selectedRotationRow]
  );
  const availableStudents = filteredStudents.filter((student) => !usedStudentIds.has(student.id));
  const usedStudents = filteredStudents.filter((student) => usedStudentIds.has(student.id));
  const isSelectedCategoryCustom = customCategories.includes(activeCategory);
  const categoryColor = getCategoryColor(activeCategory);
  const categoryIcon = getCategoryIcon(activeCategory);

  const categoryDisplayLabel = (category) => {
    if (category === "Helper") return t("random.categories.helper");
    if (category === "Guardian") return t("random.categories.guardian");
    if (category === "Line Leader") return t("random.categories.lineLeader");
    if (category === "Messenger") return t("random.categories.messenger");
    return category;
  };
  const categoryRotationLabel = (category) =>
    language === "pt-BR" && category === "Helper"
      ? t("random.categories.helperRotation")
      : categoryDisplayLabel(category);

  useEffect(() => {
    if (didImportLegacyRef.current || loading) return;
    didImportLegacyRef.current = true;
    void handleImportLegacyRandomPickerState();
  }, [handleImportLegacyRandomPickerState, loading]);

  useEffect(() => {
    if (!rotationFeedback) return undefined;
    const timer = window.setTimeout(() => setRotationFeedback(""), 2200);
    return () => window.clearTimeout(timer);
  }, [rotationFeedback]);

  const pickRandom = (list, rotationMode) => {
    if (!list.length) return;
    setIsRotationMode(rotationMode);
    setIsSpinning(true);
    window.setTimeout(() => {
      setIsSpinning(false);
      setPickedStudent(list[Math.floor(Math.random() * list.length)]);
    }, 1000);
  };
  const markUsed = async () => {
    if (!classId || !pickedStudent) return;
    const nextUsedStudentIds = Array.from(new Set([
      ...normalizeUsedStudentIds(selectedRotationRow?.used_student_ids || []),
      pickedStudent.id,
    ]));
    if (await handleSetRandomPickerRotationUsedStudents({
      classId,
      category: activeCategory,
      usedStudentIds: nextUsedStudentIds,
    })) setPickedStudent(null);
  };
  const clearUsed = async () => {
    if (!classId) return;
    if (!await handleSetRandomPickerRotationUsedStudents({
      classId,
      category: activeCategory,
      usedStudentIds: [],
    })) return;
    setRotationFeedback(usedStudentIds.size > 0
      ? t("random.feedback.resetCount", { count: usedStudentIds.size, role: categoryDisplayLabel(activeCategory) })
      : t("random.feedback.alreadyClear", { role: categoryDisplayLabel(activeCategory) }));
  };
  const addCustomCategory = async () => {
    const name = newCategoryName.trim();
    if (!classId || !name || categories.includes(name)) return;
    if (!await handleCreateRandomPickerCustomCategory({ classId, name })) return;
    setSelectedCategory(name);
    setNewCategoryName("");
    setShowAddCategory(false);
  };
  const requestDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteCategory(true);
  };
  const deleteCustomCategory = async () => {
    if (!classId || !isSelectedCategoryCustom) return;
    if (!await handleDeleteRandomPickerCustomCategory({ classId, name: activeCategory })) return;
    setSelectedCategory("Helper");
    setShowDeleteCategory(false);
  };

  return {
    classId, classLabel, filteredStudents, categories, customCategories, activeCategory,
    availableStudents, usedStudents, isSelectedCategoryCustom, categoryColor, categoryIcon,
    selectedCategory, setSelectedCategory, showAddCategory, setShowAddCategory,
    showDeleteCategory, setShowDeleteCategory, newCategoryName, setNewCategoryName,
    pickedStudent, setPickedStudent, isSpinning, isRotationMode, rotationFeedback,
    categoryDisplayLabel, categoryRotationLabel,
    handleQuickPick: () => pickRandom(filteredStudents, false),
    handleRotationPick: () => pickRandom(availableStudents, true),
    markUsed, clearUsed, addCustomCategory, requestDeleteCategory, deleteCustomCategory,
  };
}
