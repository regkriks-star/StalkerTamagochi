import { Component, type ErrorInfo, type ReactNode } from "react";
import { Download, RotateCw } from "lucide-react";
import { SAVE_KEY } from "./game";

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("КПК: необработанная ошибка интерфейса", error, info);
  }

  private downloadSave = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        window.alert("В браузере нет сохранения для выгрузки.");
        return;
      }
      const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "zone-save-recovery.json";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert("Не удалось прочитать сохранение из этого браузера.");
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="error-boundary">
        <section className="instrument error-card" role="alert">
          <span className="eyebrow">Сбой КПК</span>
          <h1>Терминал потерял связь</h1>
          <p>
            Интерфейс столкнулся с ошибкой, но прогресс остался в памяти этого
            браузера. Скачай резервную копию и перезагрузи КПК.
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              <RotateCw size={17} /> Перезагрузить
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={this.downloadSave}
            >
              <Download size={17} /> Скачать сохранение
            </button>
          </div>
        </section>
      </main>
    );
  }
}
