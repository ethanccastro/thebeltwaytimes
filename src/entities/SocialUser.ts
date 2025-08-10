import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { SocialContent } from './SocialContent';

@Entity({ tableName: 'socialuser' })
export class SocialUser {
  @PrimaryKey({ fieldName: 'socialuser_rowguid', type: 'uuid', defaultRaw: 'UUID()' })
  socialuser_rowguid!: string;

  @Property({ fieldName: 'socialuser_displayname', length: 255 })
  socialuser_displayname!: string;

  @Property({ fieldName: 'socialuser_handle', unique: true, length: 100 })
  socialuser_handle!: string;

  @Property({ fieldName: 'socialuser_profilepictureurl', nullable: true, length: 4000 })
  socialuser_profilepictureurl?: string;

  @OneToMany(() => SocialContent, content => content.socialuser)
  posts = new Collection<SocialContent>(this);
}


