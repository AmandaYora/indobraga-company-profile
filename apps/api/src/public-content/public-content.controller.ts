import { Controller, Get, Param, Query } from "@nestjs/common";
import { PublicRoute } from "@/auth/auth.decorators";
import { PublicDetailCache, PublicListCache } from "@/core/cache-control.decorator";
import { GalleryQueryDto } from "@/public-content/dto/gallery-query.dto";
import { NewsQueryDto } from "@/public-content/dto/news-query.dto";
import { PortfolioQueryDto } from "@/public-content/dto/portfolio-query.dto";
import { SlugParamDto } from "@/public-content/dto/slug-param.dto";
import { PublicContentService } from "@/public-content/public-content.service";

@Controller("public")
@PublicRoute()
export class PublicContentController {
  constructor(private readonly publicContentService: PublicContentService) {}

  @Get("site-settings")
  @PublicDetailCache()
  siteSettings() {
    return this.publicContentService.getSiteSettings();
  }

  @Get("home")
  @PublicListCache()
  home() {
    return this.publicContentService.getHome();
  }

  @Get("portfolio")
  @PublicListCache()
  portfolio(@Query() query: PortfolioQueryDto) {
    return this.publicContentService.getPortfolio(query);
  }

  @Get("portfolio-categories")
  @PublicListCache()
  portfolioCategories() {
    return this.publicContentService.getPortfolioCategories();
  }

  @Get("facilities")
  @PublicListCache()
  facilities() {
    return this.publicContentService.getFacilities();
  }

  @Get("gallery")
  @PublicListCache()
  gallery(@Query() query: GalleryQueryDto) {
    return this.publicContentService.getGallery(query);
  }

  @Get("news")
  @PublicListCache()
  news(@Query() query: NewsQueryDto) {
    return this.publicContentService.getNews(query);
  }

  @Get("news/:slug")
  @PublicDetailCache()
  newsDetail(@Param() params: SlugParamDto) {
    return this.publicContentService.getNewsDetail(params.slug);
  }
}
