# server
치카치카팀의 서버 레포지토리입니다.

Serverless Dashboard를 통해 모니터링과 CI/CD를 수행합니다.

## 기술스택
### Backend
- Nodejs
  - Authentication
    - JWT
  - ORM
    - Sequelize
  - Date library(parsing, validating, manipulating, and formatting)
    - Moment.js
  - Unit Test
    - Jest
### Data
- Database
  - mySQL
  - redis
  - eleasticsearch
- Message Queue System
  - SQS
### Infra
- Serverless Framework 
  ![serverless Framework](https://www.serverless.com/static/logo-serverless-framework-center-horizontal-dark-f3ccd2a2d03668f2b49a229cf9774ed0.png)
- AWS
  - lambda
  - S3
  - cloudFront
  - RDS
  - elesticache
  - Route53
- Firebase
  - FCM : 푸시 알림 교차 플랫폼 메시징 API
- Naver Cloud Platform
  - Simple & Easy Notification Service : 문자 전송 API
  - StaticMap : 지도를 이미지로 반환 API
- NginX
- QGIS

### Monitoring
- Serverless Dashboard
- AWS cloudwatch
- AWS X-ray