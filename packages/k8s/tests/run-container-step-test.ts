import {
  V1EnvVar,
  V1ResourceRequirements,
  V1Volume,
  V1VolumeMount
} from '@kubernetes/client-node'
import { createPodSpec, runContainerStep } from '../src/hooks'
import { createJob } from '../src/k8s'

import { TestHelper } from './test-setup'
import path from 'path'

jest.useRealTimers()

let testHelper: TestHelper

let runContainerStepData: any

describe('Run container step', () => {
  beforeEach(async () => {
    testHelper = new TestHelper()
    await testHelper.initialize()
    runContainerStepData = testHelper.getRunContainerStepDefinition()
  })

  afterEach(async () => {
    await testHelper.cleanup()
  })

  it('should not throw', async () => {
    const exitCode = await runContainerStep(runContainerStepData.args)
    expect(exitCode).toBe(0)
  })

  it('should fail if the working directory does not exist', async () => {
    runContainerStepData.args.workingDirectory = '/foo/bar'
    await expect(runContainerStep(runContainerStepData.args)).rejects.toThrow()
  })

  it('should shold have env variables available', async () => {
    runContainerStepData.args.entryPoint = 'bash'
    runContainerStepData.args.entryPointArgs = [
      '-c',
      "'if [[ -z $NODE_ENV ]]; then exit 1; fi'"
    ]
    await expect(
      runContainerStep(runContainerStepData.args)
    ).resolves.not.toThrow()
  })
})
