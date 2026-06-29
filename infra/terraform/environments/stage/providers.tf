provider "aws" {
  region = "eu-west-2"

  default_tags {
    tags = {
      Project   = "contracthubs"
      Env       = "stage"
      ManagedBy = "terraform"
    }
  }
}

# CloudFront ACM cert + WAF must live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "contracthubs"
      Env       = "stage"
      ManagedBy = "terraform"
    }
  }
}
