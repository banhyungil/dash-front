# React

- react query를 이용하면 cache key기반으로 auto fetch를 할 수 있다.
- query client를 이용해서 전체 query 상태를 관리한다.



# 성능 리팩토링 포인트

- 데이터 적재 시에 통계관련 컬럼은 계산해서 table에 적재한다

# 전역 설정 분리

- 변경 가능한 설정들은 t_setting으로 분리
- Fallback을 설정하여서 설정이 추가되더라도 