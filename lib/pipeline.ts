import * as cdk from 'aws-cdk-lib';
import { App, Stack, StackProps, Stage } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { AppStage } from './app-stage';

// Define the main Pipeline Stack
export class MyPipelineStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const pipeline = new CodePipeline(this, 'Pipeline', {
			// Enables the pipeline to update itself when the source code changes
			selfMutation: true,
			synth: new ShellStep('Synth', {
				// Use a source from CodeCommit, GitHub, etc.
				input: CodePipelineSource.gitHub('besmith43/awsPipelineFargate-example', 'main', {
					// Use a connection (recommended for GitHub)
					authentication: cdk.SecretValue.secretsManager(process.env.github_token ?? 'default-api-key'),
				}),
				commands: [
					'npm install',
					'npm run build',
					'npx cdk synth'
				],
			}),
		});

		// Add a wave of application stages (e.g., deploying to 'Beta' and 'Prod' accounts)
		// Note: Best practice is to use different AWS environments (accounts/regions) for stages
		pipeline.addStage(new AppStage(this, 'Alpha', { env: { account: '243413538688' } }));
		// pipeline.addStage(new MyServiceStage(this, 'Beta', { env: { account: '123456789012' } }));
		// pipeline.addStage(new MyServiceStage(this, 'Prod', { env: { account: '098765432109' } }));
	}
}