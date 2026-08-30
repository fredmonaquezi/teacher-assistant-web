import { supabase } from "../../../supabaseClient";
import { normalizeSubjectNames, subjectKey } from "../../../utils/classSubjects";

export default function createClassSubjectActions({ refreshAssessmentData, setFormError }) {
  const readSubjects = async (classId) => {
    const { data, error } = await supabase.from("subjects").select("id,name,sort_order").eq("class_id", classId);
    if (error) throw error;
    return data || [];
  };
  const refresh = async () => {
    if (await refreshAssessmentData() === false) throw new Error("Subjects saved, but could not be reloaded. Please retry.");
  };
  const handleAddClassSubjects = async (classId, names) => {
    setFormError("");
    try {
      const cleaned = normalizeSubjectNames(names);
      if (!classId || cleaned.some((name) => name.length > 100)) throw new Error("Choose a class and use subject names of up to 100 characters.");
      // Read fresh records so retries skip subjects that were already saved.
      const existing = await readSubjects(classId);
      const existingKeys = new Set(existing.map((item) => subjectKey(item.name)));
      const start = existing.reduce((max, item) => Math.max(max, Number(item.sort_order ?? -1)), -1) + 1;
      const rows = cleaned.filter((name) => !existingKeys.has(subjectKey(name)))
        .map((name, index) => ({ class_id: classId, name, sort_order: start + index }));
      if (rows.length) {
        const { error } = await supabase.from("subjects").insert(rows);
        if (error) throw error;
      }
      await refresh();
      return true;
    } catch (error) {
      setFormError(error.message || "Could not save subjects. Please retry.");
      return false;
    }
  };
  const handleRenameClassSubject = async (classId, subjectId, name) => {
    setFormError("");
    try {
      const [cleaned] = normalizeSubjectNames([name]);
      if (!classId || !cleaned || cleaned.length > 100) throw new Error("Enter a subject name of up to 100 characters.");
      const existing = await readSubjects(classId);
      if (!existing.some((item) => item.id === subjectId)) throw new Error("Subject not found in this class.");
      if (existing.some((item) => item.id !== subjectId && subjectKey(item.name) === subjectKey(cleaned))) throw new Error("This class already has a subject with that name.");
      const { error } = await supabase.from("subjects").update({ name: cleaned }).eq("class_id", classId).eq("id", subjectId).select("id").single();
      if (error) throw error;
      await refresh();
      return true;
    } catch (error) {
      setFormError(error.message || "Could not rename subject. Please retry.");
      return false;
    }
  };
  return { handleAddClassSubjects, handleRenameClassSubject };
}
