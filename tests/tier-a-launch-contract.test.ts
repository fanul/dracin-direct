import { describe, expect, it } from 'vitest';
import {
  LaunchVerificationStatus,
  isTierALaunchEligible,
} from '../src/lib/providers/launch-contracts';

describe('tier a launch contract', () => {
  it('accepts only verified playable providers as launch eligible', () => {
    expect(isTierALaunchEligible({
      status: LaunchVerificationStatus.VERIFIED,
      playbackReady: true,
      displayReady: true,
    })).toBe(true);

    expect(isTierALaunchEligible({
      status: LaunchVerificationStatus.BLOCKED,
      playbackReady: true,
      displayReady: true,
    })).toBe(false);
  });
});