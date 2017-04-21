/* Tips
1. Keep stages focused on producing one artifact or achieving one goal. This makes stages easier to parallelize or re-structure later.
1. Stages should simply invoke a make target or a self-contained script. Do not write testing logic in this Jenkinsfile.
3. CoreOS does not ship with `make`, so Docker builds still have to use small scripts.
*/
pipeline {
  agent {
    docker {
      image 'quay.io/coreos/tectonic-terraform:v0.8.8-coreos.1'
      label 'worker'
    }
  }

  options {
    timeout(time:35, unit:'MINUTES')
    buildDiscarder(logRotator(numToKeepStr:'20'))
  }

  stages {
    stage('TerraForm: Syntax Check') {
      steps {
        sh 'make structure-check'
      }
    }

    stage('Installer: Build & Test') {
      agent {
        docker {
          image 'quay.io/coreos/tectonic-builder:v1.4'
        }
      }
      environment {
        GO_PROJECT = '/go/src/github.com/coreos/tectonic-installer/tectonic'
      }
      steps {
        script {
            checkout scm
            sh "mkdir -p \$(dirname $GO_PROJECT) && ln -sf $WORKSPACE $GO_PROJECT"
            sh "go get github.com/golang/lint/golint"
            sh """#!/bin/bash -ex
            go version
            cd $GO_PROJECT/installer
            make tools
            make build
            make test
            """
            stash name: 'installer', includes: 'installer/bin/linux/installer'
            stash name: 'sanity', includes: 'installer/bin/sanity'
          }
        }
      }
      stage("Smoke Tests") {
      environment {
        TECTONIC_LICENSE     = credentials('TECTONIC_LICENSE')
        TECTONIC_PULL_SECRET = credentials('TECTONIC_PULL_SECRET')
      }
      steps {
        parallel (
          "TerraForm: AWS": {
            withCredentials([file(credentialsId: 'tectonic-license', variable: 'TF_VAR_tectonic_pull_secret_path'),
                             file(credentialsId: 'tectonic-pull', variable: 'TF_VAR_tectonic_license_path'),
                             [
                               $class: 'UsernamePasswordMultiBinding',
                               credentialsId: 'tectonic-aws-creds',
                               usernameVariable: 'AWS_ACCESS_KEY_ID',
                               passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                             ]
                             ]) {
            unstash 'installer'
            unstash 'sanity'
            sh '''
            # Set required configuration
            export PLATFORM=aws
            export CLUSTER="tf-${PLATFORM}-${BRANCH_NAME}-${BUILD_ID}"

            # s3 buckets require lowercase names
            export TF_VAR_tectonic_cluster_name=$(echo ${CLUSTER} | awk '{print tolower($0)}')

            # AWS specific configuration
            export AWS_REGION="us-west-2"

            # make core utils accessible to make
            export PATH=/bin:${PATH}

            # Create local config
            make localconfig

            # Use smoke test configuration for deployment
            ln -sf ${WORKSPACE}/test/aws.tfvars ${WORKSPACE}/build/${CLUSTER}/terraform.tfvars

            make plan

            # always cleanup cluster
            function shutdown() {
              make destroy
            }
            trap shutdown EXIT

            make apply
            '''
            }
          }
        )
      }
    }
  }
}
