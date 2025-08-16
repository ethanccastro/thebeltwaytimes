import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Category } from './Category';
import { Article } from './Article';

@Entity()
export class Subcategory {
  @PrimaryKey({ type: 'uuid' })
  subcategory_rowguid!: string;

  @Property({ unique: true })
  subcategory_slug!: string;

  @Property()
  subcategory_name!: string;

  @Property({ nullable: true })
  subcategory_description?: string;

  @Property({ onCreate: () => new Date() })
  subcategory_createtime: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  subcategory_updatetime: Date = new Date();

  @ManyToOne(() => Category, { fieldName: 'subcategory_categoryrowguid' })
  category!: Category;

  @OneToMany(() => Article, article => article.article_subcategoryrowguid)
  articles = new Collection<Article>(this);
}
