const MIN_BARGE_IN_CHARS = 3;

export class BargeInHandler {
  private readonly enabled: boolean;
  private speaking = false;
  private aborted = false;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  startSpeaking(): void {
    this.speaking = true;
    this.aborted = false;
  }

  stopSpeaking(): void {
    this.speaking = false;
    this.aborted = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  shouldInterrupt(partialText: string): boolean {
    if (!this.enabled || !this.speaking || this.aborted) {
      return false;
    }

    return partialText.trim().length >= MIN_BARGE_IN_CHARS;
  }

  interrupt(): void {
    if (!this.enabled || !this.speaking) {
      return;
    }

    this.aborted = true;
    this.speaking = false;
  }

  isAborted(): boolean {
    return this.aborted;
  }

  clearAborted(): void {
    this.aborted = false;
  }
}
