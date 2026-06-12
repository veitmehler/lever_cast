import { describe, it, expect } from 'vitest'
import { buildMusicFilterChain } from '../music'

describe('buildMusicFilterChain', () => {
  it('loops, trims to video length, fades out, and formats — no duck when no narration', () => {
    const chain = buildMusicFilterChain({ videoDuration: 18.12 })
    expect(chain).toContain('aloop=loop=-1')
    expect(chain).toContain('atrim=0:18.120')
    expect(chain).toContain('afade=t=out:st=16.120:d=2')
    expect(chain).toContain('aformat=sample_rates=44100:channel_layouts=stereo')
    expect(chain).not.toContain('volume=')
  })

  it('ducks −20dB (×0.1) with a 0.5s ramp COMPLETING at the narration onset', () => {
    const chain = buildMusicFilterChain({ videoDuration: 148.3, duckAtSec: 5.042 })
    // 1 − 10^(−20/20) = 0.9; ramp starts 0.5s before the voice (5.042 − 0.5)
    expect(chain).toContain(`volume='1-0.9000*clip((t-4.542)/0.5\\,0\\,1)':eval=frame`)
    expect(chain).toContain('atrim=0:148.300')
    expect(chain).toContain('afade=t=out:st=146.300:d=2')
  })

  it('holds the ducked level from the first frame when narration starts at t=0 (S3)', () => {
    const chain = buildMusicFilterChain({ videoDuration: 29.7, duckAtSec: 0 })
    expect(chain).toContain('volume=0.1000')
    expect(chain).not.toContain('clip(')
  })

  it('respects custom duck depth, ramp, and fade-out', () => {
    const chain = buildMusicFilterChain({
      videoDuration: 60,
      duckAtSec: 10,
      duckDb: 12,
      duckRampSec: 1,
      fadeOutSec: 3,
    })
    // 1 − 10^(−12/20) ≈ 0.7488; ramp starts at 10 − 1 = 9
    expect(chain).toContain('1-0.7488*clip((t-9.000)/1')
    expect(chain).toContain('afade=t=out:st=57.000:d=3')
  })

  it('clamps the fade start at 0 for videos shorter than the fade', () => {
    const chain = buildMusicFilterChain({ videoDuration: 1.5 })
    expect(chain).toContain('afade=t=out:st=0.000:d=2')
  })
})
