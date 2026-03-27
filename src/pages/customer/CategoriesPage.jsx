import { NavLink } from "react-router-dom";
import { ArrowRight, ChevronRight, Layers, Package } from "lucide-react";

import useCategoriesUi from "../../hooks/useCategoriesUi.js";

function CategoryArtwork({
  category,
  className = "h-16 w-16 rounded-2xl",
  fallbackTextClassName = "text-2xl",
}) {
  const name = String(category?.name || "").trim();
  const initial = name.charAt(0).toUpperCase() || "?";

  if (category?.imageUrl) {
    return (
      <img
        src={category.imageUrl}
        alt={name || "Category"}
        className={`${className} object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center bg-[#0090D0]/10 text-[#0090D0] shadow-sm`}
    >
      <span className={`font-bold ${fallbackTextClassName}`}>{initial}</span>
    </div>
  );
}

function CategoriesPageSkeleton() {
  return (
    <div className="space-y-6 pb-6">
      <section className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 animate-pulse sm:p-8">
        <div className="h-7 w-36 rounded-full bg-slate-200" />
        <div className="mt-4 h-10 max-w-xl rounded bg-slate-200" />
        <div className="mt-3 h-4 max-w-3xl rounded bg-slate-200" />
        <div className="mt-2 h-4 max-w-2xl rounded bg-slate-200" />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-slate-100 p-4">
              <div className="h-4 w-24 rounded bg-slate-200" />
              <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </section>

      {Array.from({ length: 3 }).map((_, index) => (
        <section
          key={index}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-pulse"
        >
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-2xl bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-6 w-32 rounded-full bg-slate-200" />
                  <div className="h-8 w-60 rounded bg-slate-200" />
                  <div className="h-4 max-w-2xl rounded bg-slate-200" />
                  <div className="h-4 max-w-xl rounded bg-slate-200" />
                </div>
              </div>

              <div className="h-11 w-40 rounded-xl bg-slate-200" />
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((__, childIndex) => (
              <div key={childIndex} className="rounded-2xl bg-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-5 w-32 rounded bg-slate-200" />
                    <div className="h-4 rounded bg-slate-200" />
                    <div className="h-4 w-5/6 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, rootCategories, isLoading } = useCategoriesUi();

  const totalCategories = categories.length;
  const totalParentCategories = rootCategories.length;
  const totalChildCategories = Math.max(totalCategories - totalParentCategories, 0);

  if (isLoading) {
    return <CategoriesPageSkeleton />;
  }

  if (totalCategories === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Package size={28} />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-800">Chưa có danh mục nào</h1>
        <p className="mt-2 text-sm text-slate-500">
          Danh mục sản phẩm sẽ xuất hiện tại đây khi dữ liệu từ hệ thống đã sẵn sàng.
        </p>
        <NavLink
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0090D0] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0077B0]"
        >
          Xem tất cả sản phẩm
          <ArrowRight size={18} />
        </NavLink>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-[#0090D0] p-6 text-white shadow-sm sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/15">
          <Layers size={16} />
          Toàn bộ danh mục
        </div>

        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Khám phá tất cả danh mục sản phẩm
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80 sm:text-base">
          Duyệt nhanh theo danh mục để tìm đúng nhóm sản phẩm phù hợp
          với nhu cầu của bạn.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="text-sm text-white/70">Tổng danh mục</div>
            <div className="mt-2 text-3xl font-bold">{totalCategories}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="text-sm text-white/70">Danh mục lớn</div>
            <div className="mt-2 text-3xl font-bold">{totalParentCategories}</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="text-sm text-white/70">Danh mục nhỏ</div>
            <div className="mt-2 text-3xl font-bold">{totalChildCategories}</div>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {rootCategories.map((category) => {
          const childCategories = category.children || [];
          const hasChildren = childCategories.length > 0;

          return (
            <article
              key={category.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-[#0090D0]/5 p-5 sm:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <CategoryArtwork
                      category={category}
                      className="h-20 w-20 rounded-2xl"
                      fallbackTextClassName="text-3xl"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center rounded-full bg-[#0090D0]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0090D0]">
                        {hasChildren ? `${childCategories.length} danh mục con` : "Danh mục độc lập"}
                      </div>

                      <h2 className="mt-3 text-2xl font-bold text-slate-900">{category.name}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {category.description ||
                          "Khám phá các sản phẩm nổi bật trong danh mục này."}
                      </p>
                    </div>
                  </div>

                  <NavLink
                    to={`/products?category=${category.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0090D0] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0077B0]"
                  >
                    Xem sản phẩm
                    <ArrowRight size={18} />
                  </NavLink>
                </div>
              </div>

              {hasChildren ? (
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Danh mục con</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Chọn nhóm cụ thể để xem đúng sản phẩm bạn đang tìm kiếm.
                      </p>
                    </div>

                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {childCategories.length} mục
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {childCategories.map((childCategory) => (
                      <NavLink
                        key={childCategory.id}
                        to={`/products?category=${childCategory.id}`}
                        className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:-translate-y-0.5 hover:border-[#0090D0]/30 hover:bg-white hover:shadow-lg"
                      >
                        <div className="flex items-start gap-3">
                          <CategoryArtwork
                            category={childCategory}
                            className="h-12 w-12 rounded-xl"
                            fallbackTextClassName="text-lg"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-[#0090D0]">
                                {childCategory.name}
                              </h4>
                              <ChevronRight
                                size={18}
                                className="mt-0.5 shrink-0 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-[#0090D0]"
                              />
                            </div>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {childCategory.description ||
                                `Xem nhanh sản phẩm thuộc ${childCategory.name}.`}
                            </p>
                          </div>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-6">
                  
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
