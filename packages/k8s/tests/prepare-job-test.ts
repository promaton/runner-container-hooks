import * as fs from 'fs'
import * as path from 'path'
import { cleanupJob, createPodSpec } from '../src/hooks'
import { prepareJob } from '../src/hooks/prepare-job'
import { TestHelper } from './test-setup'
import { createJob, createPod } from '../src/k8s'
import { V1EnvVar, V1ResourceRequirements, V1Volume, V1VolumeMount } from '@kubernetes/client-node'
import { HookData, RunContainerStepArgs } from 'hooklib/lib'

jest.useRealTimers()

let testHelper: TestHelper

let prepareJobData: any

let prepareJobOutputFilePath: string

describe('Prepare job', () => {
  beforeEach(async () => {
    testHelper = new TestHelper()
    await testHelper.initialize()
    prepareJobData = testHelper.getPrepareJobDefinition()
    prepareJobOutputFilePath = testHelper.createFile('prepare-job-output.json')
  })
  afterEach(async () => {
    await cleanupJob()
    await testHelper.cleanup()
  })

  // it('should not throw exception', async () => {
  //   await expect(
  //     prepareJob(prepareJobData.args, prepareJobOutputFilePath)
  //   ).resolves.not.toThrow()
  // })

  // it('should generate output file in JSON format', async () => {
  //   await prepareJob(prepareJobData.args, prepareJobOutputFilePath)
  //   const content = fs.readFileSync(prepareJobOutputFilePath)
  //   expect(() => JSON.parse(content.toString())).not.toThrow()
  // })

  // it('should prepare job with absolute path for userVolumeMount', async () => {
  //   prepareJobData.args.container.userMountVolumes = [
  //     {
  //       sourceVolumePath: path.join(
  //         process.env.GITHUB_WORKSPACE as string,
  //         '/myvolume'
  //       ),
  //       targetVolumePath: '/volume_mount',
  //       readOnly: false
  //     }
  //   ]
  //   await expect(
  //     prepareJob(prepareJobData.args, prepareJobOutputFilePath)
  //   ).resolves.not.toThrow()
  // })

  // it('should throw an exception if the user volume mount is absolute path outside of GITHUB_WORKSPACE', async () => {
  //   prepareJobData.args.container.userMountVolumes = [
  //     {
  //       sourceVolumePath: '/somewhere/not/in/gh-workspace',
  //       targetVolumePath: '/containermount',
  //       readOnly: false
  //     }
  //   ]
  //   await expect(
  //     prepareJob(prepareJobData.args, prepareJobOutputFilePath)
  //   ).rejects.toThrow()
  // })

  // it('should not run prepare job without the job container', async () => {
  //   prepareJobData.args.container = undefined
  //   await expect(
  //     prepareJob(prepareJobData.args, prepareJobOutputFilePath)
  //   ).rejects.toThrow()
  // })

  it('should have the extra fields set by the jobtemplate file if env variable is set', async () => {

    process.env.ACTIONS_RUNNER_POD_TEMPLATE_PATH = path.resolve(__dirname, 'podtemplate.yaml')
    
    const container = await createPodSpec(prepareJobData.args.container)
    const job = await createPod(container)

    // name, image,command should not be overwritten
    expect(job.spec?.containers[0].name).toEqual("job")
    expect(job.spec?.containers[0].image).toEqual("node:14.16")
    expect(job.spec?.containers[0].command![0]).toEqual("sh")

    //rest of template should be appended
    expect(job.spec?.containers[0].env).toContainEqual({"name": "TEST", "value": "testvalue"} as V1EnvVar)
    expect(job.spec?.containers[0].resources).toEqual({"requests": {"ephemeral-storage": "500Mi"}} as V1ResourceRequirements)
    expect(job.spec?.containers[0].volumeMounts).toContainEqual({"name": "ephemeral", "mountPath": "/tmp"} as V1VolumeMount)
    expect(job.spec?.volumes).toContainEqual({"name": "ephemeral", "emptyDir": {"sizeLimit": "500Mi"}} as V1Volume)
  })
})
