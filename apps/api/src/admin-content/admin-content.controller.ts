import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { AdminContentService } from "@/admin-content/admin-content.service";
import { AdminContentDto } from "@/admin-content/dto/admin-content.dto";
import { AdminListQueryDto } from "@/admin-content/dto/admin-list-query.dto";
import { ContentStatusUpdateDto } from "@/admin-content/dto/content-status-update.dto";
import { ReorderDto } from "@/admin-content/dto/reorder.dto";
import { SiteSettingsUpdateDto } from "@/admin-content/dto/site-settings-update.dto";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller("admin")
@NoStore()
@RequirePermissions("content.manage")
export class AdminContentController {
  constructor(private readonly content: AdminContentService) {}

  @Get("site-settings")
  @RequirePermissions("site_settings.manage")
  siteSettings() {
    return this.content.getSiteSettings();
  }

  @Patch("site-settings")
  @RequirePermissions("site_settings.manage")
  updateSiteSettings(@Body() dto: SiteSettingsUpdateDto, @Req() request: Request) {
    return this.content.updateSiteSettings(dto, actor(request));
  }

  @Get("hero")
  hero(@Query() query: AdminListQueryDto) {
    return this.content.listHero(query);
  }

  @Get("hero/:id")
  heroDetail(@Param() params: IdParamDto) {
    return this.content.getHero(params.id);
  }

  @Post("hero")
  createHero(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createHero(dto, actor(request));
  }

  @Patch("hero/:id/status")
  heroStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("hero", params.id, dto.status, actor(request));
  }

  @Patch("hero/:id")
  updateHero(@Param() params: IdParamDto, @Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.updateHero(params.id, dto, actor(request));
  }

  @Delete("hero/:id")
  deleteHero(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("hero", params.id, actor(request));
  }

  @Get("hero-slides")
  heroSlides(@Query() query: AdminListQueryDto) {
    return this.content.listHeroSlides(query);
  }

  @Patch("hero-slides/reorder")
  reorderHeroSlides(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("hero-slides", dto, actor(request));
  }

  @Get("hero-slides/:id")
  heroSlideDetail(@Param() params: IdParamDto) {
    return this.content.getHeroSlide(params.id);
  }

  @Post("hero-slides")
  createHeroSlide(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createHeroSlide(dto, actor(request));
  }

  @Patch("hero-slides/:id/status")
  heroSlideStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("hero-slides", params.id, dto.status, actor(request));
  }

  @Patch("hero-slides/:id")
  updateHeroSlide(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateHeroSlide(params.id, dto, actor(request));
  }

  @Delete("hero-slides/:id")
  deleteHeroSlide(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("hero-slides", params.id, actor(request));
  }

  @Get("partners")
  partners(@Query() query: AdminListQueryDto) {
    return this.content.listPartners(query);
  }

  @Patch("partners/reorder")
  reorderPartners(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("partners", dto, actor(request));
  }

  @Get("partners/:id")
  partnerDetail(@Param() params: IdParamDto) {
    return this.content.getPartner(params.id);
  }

  @Post("partners")
  createPartner(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createPartner(dto, actor(request));
  }

  @Patch("partners/:id/status")
  partnerStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("partners", params.id, dto.status, actor(request));
  }

  @Patch("partners/:id")
  updatePartner(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updatePartner(params.id, dto, actor(request));
  }

  @Delete("partners/:id")
  deletePartner(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("partners", params.id, actor(request));
  }

  @Get("production-strengths")
  strengths(@Query() query: AdminListQueryDto) {
    return this.content.listStrengths(query);
  }

  @Patch("production-strengths/reorder")
  reorderStrengths(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("production-strengths", dto, actor(request));
  }

  @Get("production-strengths/:id")
  strengthDetail(@Param() params: IdParamDto) {
    return this.content.getStrength(params.id);
  }

  @Post("production-strengths")
  createStrength(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createStrength(dto, actor(request));
  }

  @Patch("production-strengths/:id/status")
  strengthStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("production-strengths", params.id, dto.status, actor(request));
  }

  @Patch("production-strengths/:id")
  updateStrength(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateStrength(params.id, dto, actor(request));
  }

  @Delete("production-strengths/:id")
  deleteStrength(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("production-strengths", params.id, actor(request));
  }

  @Get("portfolio-categories")
  portfolioCategories(@Query() query: AdminListQueryDto) {
    return this.content.listPortfolioCategories(query);
  }

  @Patch("portfolio-categories/reorder")
  reorderPortfolioCategories(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("portfolio-categories", dto, actor(request));
  }

  @Get("portfolio-categories/:id")
  portfolioCategoryDetail(@Param() params: IdParamDto) {
    return this.content.getPortfolioCategory(params.id);
  }

  @Post("portfolio-categories")
  createPortfolioCategory(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createPortfolioCategory(dto, actor(request));
  }

  @Patch("portfolio-categories/:id/status")
  portfolioCategoryStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("portfolio-categories", params.id, dto.status, actor(request));
  }

  @Patch("portfolio-categories/:id")
  updatePortfolioCategory(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updatePortfolioCategory(params.id, dto, actor(request));
  }

  @Delete("portfolio-categories/:id")
  deletePortfolioCategory(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("portfolio-categories", params.id, actor(request));
  }

  @Get("portfolios")
  portfolios(@Query() query: AdminListQueryDto) {
    return this.content.listPortfolios(query);
  }

  @Patch("portfolios/reorder")
  reorderPortfolios(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("portfolios", dto, actor(request));
  }

  @Get("portfolios/:id")
  portfolioDetail(@Param() params: IdParamDto) {
    return this.content.getPortfolio(params.id);
  }

  @Post("portfolios")
  createPortfolio(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createPortfolio(dto, actor(request));
  }

  @Patch("portfolios/:id/status")
  portfolioStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("portfolios", params.id, dto.status, actor(request));
  }

  @Patch("portfolios/:id")
  updatePortfolio(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updatePortfolio(params.id, dto, actor(request));
  }

  @Delete("portfolios/:id")
  deletePortfolio(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("portfolios", params.id, actor(request));
  }

  @Get("machines")
  machines(@Query() query: AdminListQueryDto) {
    return this.content.listMachines(query);
  }

  @Patch("machines/reorder")
  reorderMachines(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("machines", dto, actor(request));
  }

  @Get("machines/:id")
  machineDetail(@Param() params: IdParamDto) {
    return this.content.getMachine(params.id);
  }

  @Post("machines")
  createMachine(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createMachine(dto, actor(request));
  }

  @Patch("machines/:id/status")
  machineStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("machines", params.id, dto.status, actor(request));
  }

  @Patch("machines/:id")
  updateMachine(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateMachine(params.id, dto, actor(request));
  }

  @Delete("machines/:id")
  deleteMachine(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("machines", params.id, actor(request));
  }

  @Get("printing-capacities")
  printingCapacities(@Query() query: AdminListQueryDto) {
    return this.content.listPrintingCapacities(query);
  }

  @Patch("printing-capacities/reorder")
  reorderPrintingCapacities(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("printing-capacities", dto, actor(request));
  }

  @Get("printing-capacities/:id")
  printingCapacityDetail(@Param() params: IdParamDto) {
    return this.content.getPrintingCapacity(params.id);
  }

  @Post("printing-capacities")
  createPrintingCapacity(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createPrintingCapacity(dto, actor(request));
  }

  @Patch("printing-capacities/:id/status")
  printingCapacityStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("printing-capacities", params.id, dto.status, actor(request));
  }

  @Patch("printing-capacities/:id")
  updatePrintingCapacity(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updatePrintingCapacity(params.id, dto, actor(request));
  }

  @Delete("printing-capacities/:id")
  deletePrintingCapacity(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("printing-capacities", params.id, actor(request));
  }

  @Get("production-capacities")
  productionCapacities(@Query() query: AdminListQueryDto) {
    return this.content.listProductionCapacities(query);
  }

  @Patch("production-capacities/reorder")
  reorderProductionCapacities(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("production-capacities", dto, actor(request));
  }

  @Get("production-capacities/:id")
  productionCapacityDetail(@Param() params: IdParamDto) {
    return this.content.getProductionCapacity(params.id);
  }

  @Post("production-capacities")
  createProductionCapacity(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createProductionCapacity(dto, actor(request));
  }

  @Patch("production-capacities/:id/status")
  productionCapacityStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus(
      "production-capacities",
      params.id,
      dto.status,
      actor(request),
    );
  }

  @Patch("production-capacities/:id")
  updateProductionCapacity(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateProductionCapacity(params.id, dto, actor(request));
  }

  @Delete("production-capacities/:id")
  deleteProductionCapacity(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("production-capacities", params.id, actor(request));
  }

  @Get("services")
  services(@Query() query: AdminListQueryDto) {
    return this.content.listServices(query);
  }

  @Patch("services/reorder")
  reorderServices(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("services", dto, actor(request));
  }

  @Get("services/:id")
  serviceDetail(@Param() params: IdParamDto) {
    return this.content.getService(params.id);
  }

  @Post("services")
  createService(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createService(dto, actor(request));
  }

  @Patch("services/:id/status")
  serviceStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("services", params.id, dto.status, actor(request));
  }

  @Patch("services/:id")
  updateService(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateService(params.id, dto, actor(request));
  }

  @Delete("services/:id")
  deleteService(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("services", params.id, actor(request));
  }

  @Get("gallery-items")
  galleryItems(@Query() query: AdminListQueryDto) {
    return this.content.listGalleryItems(query);
  }

  @Patch("gallery-items/reorder")
  reorderGalleryItems(@Body() dto: ReorderDto, @Req() request: Request) {
    return this.content.reorder("gallery-items", dto, actor(request));
  }

  @Get("gallery-items/:id")
  galleryItemDetail(@Param() params: IdParamDto) {
    return this.content.getGalleryItem(params.id);
  }

  @Post("gallery-items")
  createGalleryItem(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createGalleryItem(dto, actor(request));
  }

  @Patch("gallery-items/:id/status")
  galleryItemStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("gallery-items", params.id, dto.status, actor(request));
  }

  @Patch("gallery-items/:id")
  updateGalleryItem(
    @Param() params: IdParamDto,
    @Body() dto: AdminContentDto,
    @Req() request: Request,
  ) {
    return this.content.updateGalleryItem(params.id, dto, actor(request));
  }

  @Delete("gallery-items/:id")
  deleteGalleryItem(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("gallery-items", params.id, actor(request));
  }

  @Get("news")
  news(@Query() query: AdminListQueryDto) {
    return this.content.listNews(query);
  }

  @Get("news/:id")
  newsDetail(@Param() params: IdParamDto) {
    return this.content.getNews(params.id);
  }

  @Post("news")
  createNews(@Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.createNews(dto, actor(request));
  }

  @Patch("news/:id/status")
  newsStatus(
    @Param() params: IdParamDto,
    @Body() dto: ContentStatusUpdateDto,
    @Req() request: Request,
  ) {
    return this.content.updateStatus("news", params.id, dto.status, actor(request));
  }

  @Patch("news/:id")
  updateNews(@Param() params: IdParamDto, @Body() dto: AdminContentDto, @Req() request: Request) {
    return this.content.updateNews(params.id, dto, actor(request));
  }

  @Delete("news/:id")
  deleteNews(@Param() params: IdParamDto, @Req() request: Request) {
    return this.content.deleteResource("news", params.id, actor(request));
  }

  @Patch(":resource/:id/archive")
  archiveResource(
    @Param("resource") resource: string,
    @Param("id", ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    return this.content.archiveResourceByName(resource, id, actor(request));
  }

  @Patch(":resource/:id/unarchive")
  unarchiveResource(
    @Param("resource") resource: string,
    @Param("id", ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    return this.content.unarchiveResourceByName(resource, id, actor(request));
  }
}
