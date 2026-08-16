export type MaskCategory = "tc" | "name" | "address" | "birthDate" | "phone" | "email" | "iban";

export type Finding = {
  id: string;
  category: MaskCategory;
  value: string;
  start: number;
  end: number;
  enabled: boolean;
};

export const categoryMeta: Record<MaskCategory, { label: string; short: string }> = {
  tc: { label: "T.C. Kimlik No", short: "TC" },
  name: { label: "Ad Soyad", short: "AS" },
  address: { label: "Adres", short: "AD" },
  birthDate: { label: "Doğum Tarihi", short: "DT" },
  phone: { label: "Telefon", short: "TL" },
  email: { label: "E-posta", short: "EP" },
  iban: { label: "IBAN", short: "IB" },
};

const patterns: Array<{ category: MaskCategory; regex: RegExp; group?: number }> = [
  { category: "tc", regex: /\b[1-9]\d{10}\b/g },
  { category: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { category: "phone", regex: /(?<!\d)(?:\+?90\s*)?(?:\(?0?5\d{2}\)?[\s.-]*)\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)/g },
  { category: "iban", regex: /\bTR\s*\d{2}(?:\s*\d){22}\b/gi },
  { category: "birthDate", regex: /(?:doğum\s*tarihi|d\.\s*tarihi|doğ\.?\s*tarihi)\s*[:\-]?\s*(\d{1,2}[./-]\d{1,2}[./-](?:19|20)\d{2})/gi, group: 1 },
  { category: "address", regex: /(?:adres(?:i)?|ikametgâh(?:ı)?|ikametgah(?:ı)?)\s*[:\-]\s*([^\n]{12,180})/gi, group: 1 },
  { category: "name", regex: /(?:(?:davacı|davalı|şüpheli|sanık|müşteki|mağdur|başvurucu|katılan|borçlu|alacaklı|mirasçı|ilgili)[ \t]+vekili|adı[ \t]*[-–]?[ \t]*soyadı|ad[ıi][ \t]+ve[ \t]+soyadı|ad[ \t]*soyad|davacı|davalı|şüpheli|sanık|müşteki|mağdur|başvurucu|katılan|tanık|bilirkişi|borçlu|alacaklı|mirasçı|ilgili|anne(?:si)?|baba(?:sı)?|vekil[ \t]+eden)[ \t]*[:\-–]?[ \t]*(?:(?:av\.?|avukat|dr\.?|prof\.?)?[ \t]+)?([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü'’-]+(?:[ \t]+[A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü'’-]+){1,4})/gi, group: 1 },
];

const likelyNamePattern = /(?<![\p{L}])([A-ZÇĞİÖŞÜ][a-zçğıöşü]{1,}(?:['’-][A-ZÇĞİÖŞÜ]?[a-zçğıöşü]+)?(?:[ \t]+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{1,}(?:['’-][A-ZÇĞİÖŞÜ]?[a-zçğıöşü]+)?){1,6})(?![\p{L}])/gu;
const legalStopWords = new Set([
  "asliye", "sulh", "hukuk", "ceza", "mahkemesi", "mahkeme", "dairesi", "başkanlığı", "müdürlüğü", "müdürlüğüne",
  "cumhuriyet", "başsavcılığı", "adliyesi", "bölge", "idare", "vergi", "icra", "dosya", "esas", "karar", "sayılı", "tarihli",
  "türk", "medeni", "kanunu", "mahallesi", "caddesi", "sokağı", "sokak", "bulvarı", "apartmanı", "kat", "daire", "sayın",
  "davacı", "davalı", "şüpheli", "sanık", "müşteki", "mağdur", "başvurucu", "katılan", "tanık", "bilirkişi", "vekili", "vekil",
  "dilekçeyi", "sunan", "kimlik", "numarası", "no", "doğum", "tarihi", "adres", "telefon", "eposta",
]);

function validTc(value: string) {
  const digits = value.split("").map(Number);
  if (digits.length !== 11 || digits[0] === 0) return false;
  const tenth = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 - (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
  const eleventh = digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;
  return tenth === digits[9] && eleventh === digits[10];
}

export function detectFindings(text: string): Finding[] {
  const results: Finding[] = [];
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    const searchText = pattern.category === "name" || pattern.category === "birthDate" || pattern.category === "address"
      ? text.toLocaleLowerCase("tr-TR")
      : text;
    for (const match of searchText.matchAll(pattern.regex)) {
      const matchedValue = pattern.group ? match[pattern.group] : match[0];
      if (!matchedValue || match.index === undefined) continue;
      if (pattern.category === "tc" && !validTc(matchedValue)) continue;
      const relative = pattern.group ? match[0].lastIndexOf(matchedValue) : 0;
      const start = match.index + relative;
      const value = text.slice(start, start + matchedValue.length);
      results.push({
        id: `${pattern.category}-${start}-${value}`,
        category: pattern.category,
        value,
        start,
        end: start + value.length,
        enabled: true,
      });
    }
  }

  for (const match of text.matchAll(likelyNamePattern)) {
    const candidate = match[1];
    if (!candidate || match.index === undefined) continue;
    const tokens = candidate.split(/[ \t]+/);
    let runStart = 0;
    for (let index = 0; index <= tokens.length; index += 1) {
      const normalized = tokens[index]?.toLocaleLowerCase("tr-TR").replace(/[.'’]/g, "");
      if (index === tokens.length || legalStopWords.has(normalized)) {
        const run = tokens.slice(runStart, index);
        if (run.length >= 2 && run.length <= 5) {
          const value = run.join(" ");
          const relative = candidate.indexOf(value);
          const start = match.index + relative;
          results.push({ id: `name-${start}-${value}`, category: "name", value, start, end: start + value.length, enabled: true });
        }
        runStart = index + 1;
      }
    }
  }

  return results
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .filter((finding, index, all) => !all.slice(0, index).some((item) => finding.start >= item.start && finding.end <= item.end));
}

export function maskLabel(category: MaskCategory) {
  return `[${categoryMeta[category].label.toLocaleUpperCase("tr-TR")} MASKELENDİ]`;
}

export function maskedText(text: string, findings: Finding[]) {
  const active = findings.filter((item) => item.enabled).sort((a, b) => b.start - a.start);
  return active.reduce((output, finding) => `${output.slice(0, finding.start)}${maskLabel(finding.category)}${output.slice(finding.end)}`, text);
}
