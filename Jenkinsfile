pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
    }

    stages {

        stage('Clone') {
            steps {
                git branch: 'main', url: 'https://github.com/MohinBasha/Talk-T-Stop-Alarm.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build React App') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t talk-alarm-app .'
            }
        }

        stage('Run Docker Container') {
            steps {
                sh 'docker rm -f talk-alarm-container || true'
                sh 'docker run -d -p 5173:5173 --name talk-alarm-container talk-alarm-app'
            }
        }
    }
}