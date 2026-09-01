import { useBuildStore } from "../../store/buildStore";
import { useLanguage } from "../../i18n/LanguageContext";
import { componentRegistry } from "../../domain/data/components";

export function ActivityPanel() {
  const { language, t, componentName, caseName } = useLanguage();
  const activityMessage = (message: string) => {
    if (language === "en") return message;
    let value = message;
    for (const component of Object.values(componentRegistry)) {
      value = value.replaceAll(component.name, componentName(component.id, component.name));
    }
    const patterns: Array<[RegExp, (...parts: string[]) => string]> = [
      [/^Case switched to (.+)$/, (name) => `케이스 변경: ${caseName(name)}`],
      [/^(.+) installed at (.+)$/, (name, mount) => `${name} 설치됨 · ${mount}`],
      [/^(.+) moved to (.+)$/, (name, mount) => `${name} 이동됨 · ${mount}`],
      [/^(.+) removed from the build$/, (name) => `${name}을(를) 빌드에서 제거함`],
      [/^(.+) set to (intake|exhaust)$/, (name, direction) => `${name} 팬 방향을 ${direction === "intake" ? "흡기" : "배기"}로 설정함`],
      [/^(.+) connected to (.+)$/, (from, to) => `${from}을(를) ${to}에 연결함`],
      [/^Auto-filled build for (.+): \+(\d+) components, \+(\d+) cables, \+(\d+) fan directions$/, (formFactor, components, cables, fans) => `${caseName(formFactor)} 자동 채우기: 부품 +${components}개, 케이블 +${cables}개, 팬 방향 +${fans}개`],
      [/^Cleared build: removed (.+) components, (.+) cables\. Case preserved\.$/, (components, cables) => `빌드 비우기: 부품 ${components}개, 케이블 ${cables}개 제거 · 케이스 유지`],
      [/^Installed dual-channel RAM kit$/, () => "듀얼 채널 RAM 키트를 설치함"],
      [/^Removed RAM kit$/, () => "RAM 키트를 제거함"],
      [/^Undid (.+)$/, (action) => `실행 취소: ${action}`],
      [/^Redid (.+)$/, (action) => `다시 실행: ${action}`],
    ];
    for (const [pattern, format] of patterns) {
      const match = value.match(pattern);
      if (match) return format(...match.slice(1));
    }
    return value;
  };
  const activity = useBuildStore((state) => state.activity);

  return (
    <section className="activity-panel" aria-labelledby="activity-title">
      <div className="panel-heading">
        <div>
          <h2 id="activity-title">{t("activity.title")}</h2>
          <p className="panel-caption">{t("activity.caption")}</p>
        </div>
        <span className="activity-count">{activity.length}</span>
      </div>
      {activity.length === 0 ? (
        <p className="empty-state">{t("activity.empty")}</p>
      ) : (
        <ol className="activity-list">
          {activity.map((entry) => (
            <li key={entry.id}>
              <span className={`actor-badge actor-${entry.actor.toLowerCase()}`}>{t(`actor.${entry.actor}`)}</span>
              <span className="activity-message">{activityMessage(entry.message)}</span>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleTimeString(language === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
