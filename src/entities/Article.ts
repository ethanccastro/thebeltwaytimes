import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Category } from './Category';
import { Subcategory } from './Subcategory';

@Entity()
export class Article {
  @PrimaryKey({ type: 'uuid' })
  article_rowguid!: string;

  @Property({ length: 500 })
  article_headline!: string;

  @Property({ unique: true, length: 500 })
  article_slug!: string;

  @Property({ type: 'text' })
  article_excerpt!: string;

  @Property({ type: 'text' })
  article_content!: string;

  @Property({ length: 255 })
  article_author!: string;

  @ManyToOne(() => Category, { fieldName: 'article_categoryrowguid' })
  article_categoryrowguid!: Category;

  @ManyToOne(() => Subcategory, {
    nullable: true,
    fieldName: 'article_subcategoryrowguid',
  })
  article_subcategoryrowguid?: Subcategory;

  @Property({ fieldName: 'article_publishedat' })
  article_publishedat!: Date;

  @Property({ nullable: true, length: 4000, fieldName: 'article_imageurl' })
  article_imageurl?: string;

  @Property({ fieldName: 'article_readtime' })
  article_readtime!: number;

  @Property({ type: 'json', nullable: true, fieldName: 'article_tags' })
  article_tags?: string[];

  @Property({ default: false, fieldName: 'article_featured' })
  article_featured: boolean = false;

  @Property({ default: false, fieldName: 'article_isopinion' })
  article_isopinion: boolean = false;

  @Property({ default: false, fieldName: 'article_main' })
  article_main: boolean = false;

  @Property({ default: false, fieldName: 'article_trending' })
  article_trending: boolean = false;

  @Property({ default: false, fieldName: 'article_categoryblock' })
  article_categoryblock: boolean = false;

  @Property({ onCreate: () => new Date(), fieldName: 'article_createtime' })
  article_createtime: Date = new Date();

  @Property({ onUpdate: () => new Date(), fieldName: 'article_updatetime' })
  article_updatetime: Date = new Date();
}
