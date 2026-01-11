import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppStack } from './app-stack';


export class AppStage extends cdk.Stage {
	constructor(scope: Construct, stageName: string, props?: cdk.StackProps) {
		super(scope, stageName, props);

		const appStack = new AppStack(this, 'AppStack', stageName);
	}
}