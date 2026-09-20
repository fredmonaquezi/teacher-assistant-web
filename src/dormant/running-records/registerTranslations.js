import i18n from "../../i18n";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

i18n.addResourceBundle("en", "translation", { runningRecords: en }, true, true);
i18n.addResourceBundle("pt-BR", "translation", { runningRecords: ptBR }, true, true);
