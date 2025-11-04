import { supabase } from "@/lib/supabase-client";

/**
 * Supabase를 사용한 온라인 클라이언트
 * Base44 API 대신 Supabase를 백엔드로 사용
 */

class SupabaseEntity {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async list(sortBy = "-created_date") {
    console.log(`🌐 Supabase에서 ${this.tableName} 목록 가져오기`);

    // 정렬 파싱
    let orderField = "created_date";
    let ascending = false;

    if (sortBy) {
      if (sortBy.startsWith("-")) {
        orderField = sortBy.slice(1);
        ascending = false;
      } else {
        orderField = sortBy;
        ascending = true;
      }
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .order(orderField, { ascending });

    if (error) {
      console.error(`❌ ${this.tableName} 목록 가져오기 실패:`, error);
      throw error;
    }

    return data || [];
  }

  async get(id) {
    console.log(`🌐 Supabase에서 ${this.tableName} 항목 가져오기:`, id);

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error(`❌ ${this.tableName} 가져오기 실패:`, error);
      throw error;
    }

    return data;
  }

  async create(data) {
    console.log(`🌐 Supabase에 ${this.tableName} 생성:`, data);

    // 현재 사용자 ID 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const item = {
      ...data,
      id: data.id || crypto.randomUUID(),
      user_id: user?.id, // 자동으로 user_id 추가
      created_date: data.created_date || new Date().toISOString(),
      updated_date: data.updated_date || new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error(`❌ ${this.tableName} 생성 실패:`, error);
      throw error;
    }

    return result;
  }

  async update(id, data) {
    console.log(`🌐 Supabase에서 ${this.tableName} 업데이트:`, id);

    const updated = {
      ...data,
      updated_date: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updated)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`❌ ${this.tableName} 업데이트 실패:`, error);
      throw error;
    }

    return result;
  }

  async delete(id) {
    console.log(`🌐 Supabase에서 ${this.tableName} 삭제:`, id);

    const { error } = await supabase.from(this.tableName).delete().eq("id", id);

    if (error) {
      console.error(`❌ ${this.tableName} 삭제 실패:`, error);
      throw error;
    }

    return { success: true };
  }

  async deleteMany(ids) {
    console.log(`🌐 Supabase에서 ${this.tableName} 일괄 삭제:`, ids);

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .in("id", ids);

    if (error) {
      console.error(`❌ ${this.tableName} 일괄 삭제 실패:`, error);
      throw error;
    }

    return { success: true, count: ids.length };
  }
}

// Supabase 인증
const supabaseAuth = {
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.log("👤 인증되지 않은 사용자");
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      avatar_url: user.user_metadata?.avatar_url,
      isLocal: false,
    };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ 로그인 실패:", error);
      throw error;
    }

    return data.user;
  },

  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      console.error("❌ 회원가입 실패:", error);
      throw error;
    }

    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ 로그아웃 실패:", error);
      throw error;
    }

    return { success: true };
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("❌ 비밀번호 재설정 실패:", error);
      throw error;
    }

    return { success: true };
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  get isAuthenticated() {
    return supabase.auth.getSession().then(({ data }) => !!data.session);
  },
};

// Supabase 클라이언트
export const supabaseClient = {
  entities: {
    Note: new SupabaseEntity("notes"),
    Folder: new SupabaseEntity("folders"),
    Reference: new SupabaseEntity("references"),
    Project: new SupabaseEntity("projects"),
    Template: new SupabaseEntity("templates"),
    ProjectSettings: new SupabaseEntity("project_settings"),
    CitationStyle: new SupabaseEntity("citation_styles"),
    NoteVersion: new SupabaseEntity("note_versions"),
    DailyNote: new SupabaseEntity("daily_notes"),
  },

  auth: supabaseAuth,

  // Supabase functions
  functions: {
    // 필요한 경우 Supabase Edge Functions 호출
    async invoke(functionName, params) {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params,
      });

      if (error) {
        console.error(`❌ 함수 호출 실패 (${functionName}):`, error);
        throw error;
      }

      return data;
    },
  },

  // 원시 Supabase 클라이언트 노출 (필요한 경우)
  raw: supabase,
};
