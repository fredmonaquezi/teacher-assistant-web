import { useTranslation } from "react-i18next";
import { STUDENT_GENDER_OPTIONS } from "../../constants/options";
const keys = { Male: "male", Female: "female", "Non-binary": "nonBinary", "Prefer not to say": "preferNotToSay" };
export default function StudentGenderField({ value, onChange }) {
  const { t } = useTranslation();
  return <label className="stack"><span>{t("studentEdit.gender")}</span>
    <select value={value || "Prefer not to say"} onChange={(event) => onChange(event.target.value)}>
      {STUDENT_GENDER_OPTIONS.map((option) => <option key={option} value={option}>{t(`common.gender.${keys[option]}`)}</option>)}
    </select>
  </label>;
}
