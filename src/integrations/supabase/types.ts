export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_backups: {
        Row: {
          created_at: string
          id: string
          label: string
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      app_locales: {
        Row: {
          created_at: string
          flag: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag?: string
          id: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_translations: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_manual: boolean
          locale: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_manual?: boolean
          locale: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_manual?: boolean
          locale?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cuisines: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      department_aliases: {
        Row: {
          created_at: string
          department_id: string
          id: string
          parent_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          parent_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          parent_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_aliases_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_aliases_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string | null
          created_at: string
          emoji: string | null
          icon_custom: boolean
          icon_path: string | null
          id: string
          image_path: string | null
          name: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          icon_custom?: boolean
          icon_path?: string | null
          id?: string
          image_path?: string | null
          name: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          icon_custom?: boolean
          icon_path?: string | null
          id?: string
          image_path?: string | null
          name?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      diets: {
        Row: {
          builtin: boolean
          created_at: string
          emoji: string | null
          enabled: boolean
          id: string
          labels: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          builtin?: boolean
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id: string
          labels?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          builtin?: boolean
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id?: string
          labels?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      feedback_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string | null
          message: string
          name: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string | null
          message: string
          name: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string | null
          message?: string
          name?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      import_candidates: {
        Row: {
          created_at: string
          currency: string | null
          department_id: string | null
          emoji: string | null
          id: string
          market: string
          match_product_id: string | null
          match_type: string
          pack_size: number | null
          pack_unit: string | null
          price: number | null
          raw_name: string
          source_id: string | null
          source_url: string | null
          status: string
          suggested_name: string
          unit_basis: string | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          department_id?: string | null
          emoji?: string | null
          id?: string
          market?: string
          match_product_id?: string | null
          match_type?: string
          pack_size?: number | null
          pack_unit?: string | null
          price?: number | null
          raw_name: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          suggested_name: string
          unit_basis?: string | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          department_id?: string | null
          emoji?: string | null
          id?: string
          market?: string
          match_product_id?: string | null
          match_type?: string
          pack_size?: number | null
          pack_unit?: string | null
          price?: number | null
          raw_name?: string
          source_id?: string | null
          source_url?: string | null
          status?: string
          suggested_name?: string
          unit_basis?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_candidates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_candidates_match_product_id_fkey"
            columns: ["match_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_candidates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "import_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      import_sources: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          interval: string
          last_run_at: string | null
          last_status: string | null
          market: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          interval?: string
          last_run_at?: string | null
          last_status?: string | null
          market?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          interval?: string
          last_run_at?: string | null
          last_status?: string | null
          market?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_by: string | null
          added_by_name: string | null
          brand: string | null
          checked: boolean
          checked_by_name: string | null
          created_at: string
          emoji: string | null
          group_emoji: string | null
          group_label: string | null
          id: string
          image_url: string | null
          list_id: string
          name: string
          note: string | null
          organic: boolean
          product_id: string | null
          quantity: string
          sort_order: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          added_by_name?: string | null
          brand?: string | null
          checked?: boolean
          checked_by_name?: string | null
          created_at?: string
          emoji?: string | null
          group_emoji?: string | null
          group_label?: string | null
          id?: string
          image_url?: string | null
          list_id: string
          name: string
          note?: string | null
          organic?: boolean
          product_id?: string | null
          quantity?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          added_by_name?: string | null
          brand?: string | null
          checked?: boolean
          checked_by_name?: string | null
          created_at?: string
          emoji?: string | null
          group_emoji?: string | null
          group_label?: string | null
          id?: string
          image_url?: string | null
          list_id?: string
          name?: string
          note?: string | null
          organic?: boolean
          product_id?: string | null
          quantity?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_members: {
        Row: {
          display_name: string | null
          id: string
          joined_at: string
          list_id: string
          role: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          joined_at?: string
          list_id: string
          role?: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          joined_at?: string
          list_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      market_admins: {
        Row: {
          created_at: string
          email: string | null
          id: string
          market: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          market: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          market?: string
          user_id?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          code: string
          created_at: string
          currency: string
          enabled: boolean
          flag: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          enabled?: boolean
          flag?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          enabled?: boolean
          flag?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          added_at: string
          emoji: string | null
          id: string
          image_url: string | null
          name: string
          organic: boolean
          product_id: string | null
          quantity: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          name: string
          organic?: boolean
          product_id?: string | null
          quantity?: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          emoji?: string | null
          id?: string
          image_url?: string | null
          name?: string
          organic?: boolean
          product_id?: string | null
          quantity?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_aliases: {
        Row: {
          created_at: string
          department_id: string
          id: string
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_aliases_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_aliases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_brands: {
        Row: {
          created_at: string
          id: string
          locales: string[]
          name: string
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locales?: string[]
          name: string
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locales?: string[]
          name?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_brands_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_cuisines: {
        Row: {
          created_at: string
          cuisine_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          cuisine_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          cuisine_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_cuisines_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cuisines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_headings: {
        Row: {
          before_product_id: string
          created_at: string
          department_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          before_product_id: string
          created_at?: string
          department_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          before_product_id?: string
          created_at?: string
          department_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_headings_before_product_id_fkey"
            columns: ["before_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_headings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_market_exclusions: {
        Row: {
          created_at: string
          id: string
          market: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_market_exclusions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_market_order: {
        Row: {
          created_at: string
          id: string
          market: string
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          market: string
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          market?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_market_order_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reference_prices: {
        Row: {
          created_at: string
          currency: string
          id: string
          market: string
          observed_at: string
          pack_size: number | null
          pack_unit: string | null
          price: number
          product_id: string
          source_id: string | null
          unit_basis: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          market: string
          observed_at?: string
          pack_size?: number | null
          pack_unit?: string | null
          price: number
          product_id: string
          source_id?: string | null
          unit_basis?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          market?: string
          observed_at?: string
          pack_size?: number | null
          pack_unit?: string | null
          price?: number
          product_id?: string
          source_id?: string | null
          unit_basis?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reference_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reference_prices_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "import_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      product_synonyms: {
        Row: {
          created_at: string
          id: string
          locale: string
          product_id: string
          term: string
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string
          product_id: string
          term: string
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          product_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_synonyms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_images: {
        Row: {
          created_at: string
          icon_path: string | null
          id: string
          image_path: string | null
          product_id: string
          updated_at: string
          variant: string
        }
        Insert: {
          created_at?: string
          icon_path?: string | null
          id?: string
          image_path?: string | null
          product_id: string
          updated_at?: string
          variant: string
        }
        Update: {
          created_at?: string
          icon_path?: string | null
          id?: string
          image_path?: string | null
          product_id?: string
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allowed_units: string[]
          created_at: string
          default_quantity: number
          default_unit: string
          department_id: string
          emoji: string | null
          excluded_diets: string[]
          icon_custom: boolean
          icon_path: string | null
          id: string
          image_path: string | null
          markets: string[]
          name: string
          organic_available: boolean
          sort_order: number
          updated_at: string
          variants: string[]
        }
        Insert: {
          allowed_units?: string[]
          created_at?: string
          default_quantity?: number
          default_unit?: string
          department_id: string
          emoji?: string | null
          excluded_diets?: string[]
          icon_custom?: boolean
          icon_path?: string | null
          id?: string
          image_path?: string | null
          markets?: string[]
          name: string
          organic_available?: boolean
          sort_order?: number
          updated_at?: string
          variants?: string[]
        }
        Update: {
          allowed_units?: string[]
          created_at?: string
          default_quantity?: number
          default_unit?: string
          department_id?: string
          emoji?: string | null
          excluded_diets?: string[]
          icon_custom?: boolean
          icon_path?: string | null
          id?: string
          image_path?: string | null
          markets?: string[]
          name?: string
          organic_available?: boolean
          sort_order?: number
          updated_at?: string
          variants?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          device_token: string
          favorite_product_ids: string[]
          id: string
          locale: string
          notify_comments: boolean
          notify_new_favorites: boolean
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_token: string
          favorite_product_ids?: string[]
          id?: string
          locale?: string
          notify_comments?: boolean
          notify_new_favorites?: boolean
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_token?: string
          favorite_product_ids?: string[]
          id?: string
          locale?: string
          notify_comments?: boolean
          notify_new_favorites?: boolean
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_comments: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_cuisines: {
        Row: {
          created_at: string
          cuisine_id: string
          id: string
          recipe_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuisine_id: string
          id?: string
          recipe_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuisine_id?: string
          id?: string
          recipe_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_cuisines_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_cuisines_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          parent_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          parent_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_groups: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "recipe_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_groups_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recipe_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          product_id: string
          sort_order: number
          step_key: string
          template_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          product_id: string
          sort_order?: number
          step_key: string
          template_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          step_key?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "recipe_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_popular: {
        Row: {
          created_at: string
          id: string
          picks: Json
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          picks?: Json
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          picks?: Json
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_popular_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recipe_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_saves: {
        Row: {
          created_at: string
          custom_title: string | null
          folder_id: string | null
          id: string
          recipe_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_title?: string | null
          folder_id?: string | null
          id?: string
          recipe_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          custom_title?: string | null
          folder_id?: string | null
          id?: string
          recipe_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_saves_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "recipe_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_saves_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          key: string
          max: number
          min: number
          name: string
          required: boolean
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          key: string
          max?: number
          min?: number
          name: string
          required?: boolean
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          key?: string
          max?: number
          min?: number
          name?: string
          required?: boolean
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recipe_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_templates: {
        Row: {
          color: string | null
          created_at: string
          emoji: string | null
          enabled: boolean
          id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          author_name: string | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          image_path: string | null
          is_public: boolean
          items: Json
          owner_id: string
          picks: Json
          price_class: string | null
          product_ids: string[]
          satiety: string | null
          share_slug: string | null
          spiciness: string | null
          taste: string | null
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_path?: string | null
          is_public?: boolean
          items?: Json
          owner_id: string
          picks?: Json
          price_class?: string | null
          product_ids?: string[]
          satiety?: string | null
          share_slug?: string | null
          spiciness?: string | null
          taste?: string | null
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_path?: string | null
          is_public?: boolean
          items?: Json
          owner_id?: string
          picks?: Json
          price_class?: string | null
          product_ids?: string[]
          satiety?: string | null
          share_slug?: string | null
          spiciness?: string | null
          taste?: string | null
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          is_template: boolean
          name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          is_template?: boolean
          name?: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          is_template?: boolean
          name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      speech_texts: {
        Row: {
          created_at: string
          id: string
          key: string
          locale: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          locale: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          locale?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      standard_variants: {
        Row: {
          created_at: string
          id: string
          labels: Json
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      supermarkets: {
        Row: {
          created_at: string
          emoji: string | null
          enabled: boolean
          id: string
          market_code: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id?: string
          market_code: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          enabled?: boolean
          id?: string
          market_code?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supermarkets_market_code_fkey"
            columns: ["market_code"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["code"]
          },
        ]
      }
      ui_translations: {
        Row: {
          created_at: string
          id: string
          key: string
          locale: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          locale: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          locale?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ui_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "app_locales"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          builtin: boolean
          created_at: string
          enabled: boolean
          hidden_markets: string[]
          id: string
          labels: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          builtin?: boolean
          created_at?: string
          enabled?: boolean
          hidden_markets?: string[]
          id: string
          labels?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          builtin?: boolean
          created_at?: string
          enabled?: boolean
          hidden_markets?: string[]
          id?: string
          labels?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_synonyms: {
        Row: {
          created_at: string
          id: string
          locale: string
          product_id: string
          term: string
          variant: string
        }
        Insert: {
          created_at?: string
          id?: string
          locale: string
          product_id: string
          term: string
          variant: string
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          product_id?: string
          term?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_synonyms_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_translations: {
        Row: {
          created_at: string
          id: string
          is_manual: boolean
          locale: string
          name: string
          product_id: string
          updated_at: string
          variant: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_manual?: boolean
          locale: string
          name: string
          product_id: string
          updated_at?: string
          variant: string
        }
        Update: {
          created_at?: string
          id?: string
          is_manual?: boolean
          locale?: string
          name?: string
          product_id?: string
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_list: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_list_member: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      is_list_owner: {
        Args: { _list_id: string; _user_id: string }
        Returns: boolean
      }
      is_market_admin: {
        Args: { _market: string; _user_id: string }
        Returns: boolean
      }
      is_market_product_admin: {
        Args: { _product_id: string; _user_id: string }
        Returns: boolean
      }
      join_list_by_invite: { Args: { _code: string }; Returns: string }
      recipe_feed: {
        Args: { _limit?: number; _order?: string; _product_ids?: string[] }
        Returns: {
          author_name: string
          avg_rating: number
          created_at: string
          description: string
          id: string
          image_path: string
          items: Json
          match_count: number
          product_ids: string[]
          rating_count: number
          save_count: number
          share_slug: string
          template_id: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      unit_of_measure:
        | "stueck"
        | "gramm"
        | "kilogramm"
        | "milligramm"
        | "pfund"
        | "unzen"
        | "milliliter"
        | "deziliter"
        | "liter"
        | "gallone"
        | "tasse"
        | "glas"
        | "flasche"
        | "dose"
        | "beutel"
        | "packung"
        | "schachtel"
        | "box"
        | "karton"
        | "kiste"
        | "kanister"
        | "buendel"
        | "portion"
        | "sack"
        | "eimer"
        | "becher"
        | "tube"
        | "netz"
        | "palette"
        | "tablett"
        | "rolle"
        | "blister"
        | "sixpack"
        | "artikel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      unit_of_measure: [
        "stueck",
        "gramm",
        "kilogramm",
        "milligramm",
        "pfund",
        "unzen",
        "milliliter",
        "deziliter",
        "liter",
        "gallone",
        "tasse",
        "glas",
        "flasche",
        "dose",
        "beutel",
        "packung",
        "schachtel",
        "box",
        "karton",
        "kiste",
        "kanister",
        "buendel",
        "portion",
        "sack",
        "eimer",
        "becher",
        "tube",
        "netz",
        "palette",
        "tablett",
        "rolle",
        "blister",
        "sixpack",
        "artikel",
      ],
    },
  },
} as const
