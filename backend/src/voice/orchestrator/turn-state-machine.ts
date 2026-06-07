export type TurnState =
  | 'greeting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'handoff'
  | 'closing';

export type TurnEvent =
  | 'greeting_complete'
  | 'speech_endpoint'
  | 'response_ready'
  | 'tts_complete'
  | 'barge_in'
  | 'escalation'
  | 'silence_timeout'
  | 'handoff_complete'
  | 'close';

const TRANSITIONS: Record<TurnState, Partial<Record<TurnEvent, TurnState>>> = {
  greeting: { greeting_complete: 'listening' },
  listening: {
    speech_endpoint: 'processing',
    silence_timeout: 'closing',
    escalation: 'handoff',
  },
  processing: {
    response_ready: 'speaking',
    escalation: 'handoff',
  },
  speaking: {
    tts_complete: 'listening',
    barge_in: 'interrupted',
    escalation: 'handoff',
  },
  interrupted: { speech_endpoint: 'processing' },
  handoff: { handoff_complete: 'handoff' },
  closing: { close: 'closing' },
};

export class TurnStateMachine {
  private state: TurnState = 'greeting';

  getState(): TurnState {
    return this.state;
  }

  transition(event: TurnEvent): TurnState {
    const next = TRANSITIONS[this.state][event];
    if (next) {
      this.state = next;
    }
    return this.state;
  }

  forceState(state: TurnState): void {
    this.state = state;
  }

  acceptsUserSpeech(): boolean {
    return this.state === 'listening' || this.state === 'interrupted' || this.state === 'speaking';
  }

  acceptsBargeIn(): boolean {
    return this.state === 'speaking';
  }

  isTerminal(): boolean {
    return this.state === 'handoff' || this.state === 'closing';
  }
}
