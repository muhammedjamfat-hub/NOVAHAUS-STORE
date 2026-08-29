import { supabaseServer } from "@/lib/supabase-server";
import ProductCard from "@/components/ProductCard";
import ShopFilters from "@/components/ShopFilters";
import { Product, Category } from "@/lib/types";

export const revalidate = 30;

interface ShopPageProps {
  searchParams: {
    category?: string;
    sort?: string;
    q?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

async function getShopData(params: ShopPageProps["searchParams"]) {
  const supabase = supabaseServer();

  let query = supabase.from("products").select("*").eq("active", true);

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }
  if (params.minPrice) {
    query = query.gte("price", Number(params.minPrice));
  }
  if (params.maxPrice) {
    query = query.lte("price", Number(params.maxPrice));
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  switch (params.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "bestselling":
      query = query.order("bestseller", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: products } = await query;
  const { data: categories } = await supabase.from("categories").select("*");

  return { products: (products as Product[]) || [], categories: (categories as Category[]) || [] };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { products, categories } = await getShopData(searchParams);

  return (
    <div className="container-nova py-12">
      <h1 className="font-serif text-3xl mb-8">Shop All Watches</h1>

      <ShopFilters categories={categories} />

      {products.length === 0 ? (
        <p className="text-center text-gray-500 py-24">No watches found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
