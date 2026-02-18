import os
import pg8000.native

# [교수님 노트] 파이썬 기초 및 데이터베이스 연동 교육용 스크립트 v3
# 학생 여러분, Connection 객체를 직접 생성하는 방식으로 코드를 수정했습니다.

def check_global_quota():
    # Neon DB 연결 주소
    db_url = "postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    
    print("🎓 [파이썬 기초 강의] 데이터베이스 할당량 확인하기")
    print("-" * 50)
    
    try:
        # [기초] 1. 데이터베이스 연결
        # pg8000.native.Connection을 사용하여 인스턴스를 생성합니다.
        con = pg8000.native.Connection(
            user="neondb_owner",
            password="npg_RxOvMV2BQ4Lo",
            host="ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech",
            database="neondb",
            port=5432,
            ssl_context=True
        )
        print("🔗 데이터베이스 연결 성공!")
        
        # [기초] 2. 데이터 조회
        query = "SELECT city_id, COUNT(*) FROM landmarks GROUP BY city_id"
        results = con.run(query)
        
        # [기초] 3. 결과 출력
        total_count = 0
        print("\n📊 현재 등록된 명소(Quota) 현황:")
        print(f"{'도시(City)':<15} | {'개수(Count)':<10}")
        print("-" * 30)
        
        for row in results:
            city_name, count = row
            total_count += count
            print(f"{city_name:<15} | {count:<10}")
            
        print("-" * 30)
        print(f"✅ 총 시스템 할당량 사용: {total_count}개 명소")
        
        con.close()
        
    except Exception as e:
        print(f"❌ [오류 발생]: {e}")

if __name__ == "__main__":
    check_global_quota()
