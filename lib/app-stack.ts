import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';


export class AppStack extends cdk.Stack {
	constructor(scope: Construct, id: string, stageName: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Create ECR repository
		const repository = new ecr.Repository(this, 'Repository', {
			repositoryName: 'my-fargate-app',
		});

		// Create VPC and ECS cluster
		const vpc = new ec2.Vpc(this, 'Vpc', {
			maxAzs: 2,
			cidr: '10.0.0.0/16',
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: 'public',
					subnetType: ec2.SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: 'private',
					subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
				},
			],
		});

		const cluster = new ecs.Cluster(this, 'Cluster', {
			vpc: vpc,
		});

		// Create ECS task definition
		const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
			memoryLimitMiB: 512,
			cpu: 256,
		});

		// Add container to task definition
		taskDefinition.addContainer('Container', {
			image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
			portMappings: [{ containerPort: 8443 }],
		});

		// Create ECS service
		const service = new ecs.FargateService(this, 'Service', {
			cluster: cluster,
			taskDefinition: taskDefinition,
			desiredCount: 2,
		});

		// Create load balancer
		const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LB', {
			vpc: vpc,
			internetFacing: true,
		});

		// Create Certificate for custom domain
		const certificate = new acm.Certificate(this, 'Certificate', {
			domainName: stageName + '.besmithaws.click',
			validation: acm.CertificateValidation.fromDns()
		});

		// Create A Record in Route53
		const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
			domainName: 'besmithaws.click'
		});

		new route53.ARecord(this, 'AliasRecord', {
			recordName: stageName,
			target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(loadBalancer)),
			zone: zone
		});

		const listener = loadBalancer.addListener('Listener', {
			port: 443,
			protocol: elbv2.ApplicationProtocol.HTTPS,
			sslPolicy: elbv2.SslPolicy.TLS12,
			certificates: [certificate]
		});

		listener.addTargets('Target', {
			port: 443,
			targets: [service],
		});

		// Output the load balancer URL
		new cdk.CfnOutput(this, 'LoadBalancerUrl', {
			value: loadBalancer.loadBalancerDnsName,
			description: 'The URL of the load balancer',
		});
	}
}