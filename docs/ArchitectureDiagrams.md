# Architecture diagrams

These can be generated from CDK code within the application automatically using

* [cdk-dia](https://github.com/pistazie/cdk-dia)
  * Install cdk-dia and graphviz globally
  * Within `main/infra` (or wherever `cdk.out` is located) execute `cdk-dia`
  * The generated png should be reviewed since it will need a few alterations to fix issues such as
    * name truncation
    * WAF icons missing
    * API GW color
  * A .dot diagram is also produced, and can be edited in [PlantUML](https://plantuml.corp.amazon.com/plantuml/form/encoded.html), but this omit all the icons for the elements so should not be used
* Other tools
  * [CFN Designer](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/working-with-templates-cfn-designer-canvas-details.html)
  * Uses icons that don't match the [latest guidance](https://aws.amazon.com/architecture/icons/) and [design inspector](https://design-inspector.a2z.com/) won't import them
* [AWS Perspective](https://aws.amazon.com/solutions/implementations/aws-perspective/)
  * Is not a service
  * Requires multiple stacks to be spun up, which may incur deployment errors
  * [Relatively expensive](https://docs.aws.amazon.com/solutions/latest/aws-perspective/cost.html)
