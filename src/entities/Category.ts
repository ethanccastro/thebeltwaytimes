import {
  Entity,
  PrimaryKey,
  Property,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Subcategory } from './Subcategory';
import { Article } from './Article';

@Entity()
export class Category {
  @PrimaryKey({ type: 'uuid' })
  category_rowguid!: string;

  @Property({ unique: true })
  category_slug!: string;

  @Property()
  category_name!: string;

  @Property({ nullable: true })
  category_description?: string;

  @Property({ nullable: true })
  category_color?: string;

  @Property({ onCreate: () => new Date() })
  category_createtime: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  category_updatetime: Date = new Date();

  @OneToMany(() => Subcategory, subcategory => subcategory.category)
  subcategories = new Collection<Subcategory>(this);

  @OneToMany(() => Article, article => article.article_categoryrowguid)
  articles = new Collection<Article>(this);
}
